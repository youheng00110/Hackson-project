/**
 * 自动决策服务：自助获取路况 + 天气并输出结构化结果
 */

const axios = require('axios');
const amapService = require('./amapService');
const geoUtils = require('../utils/geoUtils');

const LARGE_MALL_REGEX = /(万达广场|万象城|大悦城|吾悦广场|龙湖天街|奥特莱斯|银泰|印象城|来福士|合生汇|恒隆广场|正大广场|环球港|世贸|国贸|城市广场|购物中心|中心广场|广场购物中心|商场)/i;
const REPUTATION_REGEX = /(万达广场|万象城|大悦城|吾悦广场|龙湖天街|奥特莱斯|银泰|印象城|来福士|合生汇|恒隆广场|正大广场|环球港|星巴克|海底捞|麦当劳|肯德基|必胜客|瑞幸|喜茶|奈雪)/i;
const METRO_REGEX = /(地铁|站|轨道)/i;
const PARKING_REGEX = /(停车|车位|停车场)/i;

const SPEED_MAP = {
    walking: 5,
    bicycling: 15,
    transit: 25,
    public_transport: 25,
    driving: 40
};

class AiAutoDecisionService {
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async getWeather(districtId) {
        const apiKey = process.env.BMAP_SERVER_KEY;
        if (!apiKey) {
            throw new Error('BMAP_SERVER_KEY 未配置');
        }

        if (!districtId) {
            throw new Error('缺少 district_id');
        }

        const response = await axios.get('https://api.map.baidu.com/weather/v1/', {
            params: {
                district_id: districtId,
                data_type: 'all',
                ak: apiKey
            },
            timeout: 60000
        });

        if (response.data?.status !== 0) {
            throw new Error(response.data?.message || '天气查询失败');
        }

        const now = response.data?.result?.now || {};
        const weatherText = now.text || '未知';
        const temp = typeof now.temp === 'number' ? now.temp : (now.temp ? Number(now.temp) : null);
        const wind = typeof now.wind_speed === 'number' ? now.wind_speed : (now.wind_speed ? Number(now.wind_speed) : null);

        const isRain = /雨|雷|雪/.test(weatherText);
        const isWind = wind !== null && wind >= 8;
        const isHot = temp !== null && temp >= 33;
        const isCold = temp !== null && temp <= 0;
        const isBad = isRain || isWind || isHot || isCold;

        return {
            text: weatherText,
            temp,
            wind,
            isBad
        };
    }

    async getTrafficAround(lng, lat) {
        try {
            const apiKey = process.env.BMAP_SERVER_KEY;
            if (!apiKey) return null;

            const response = await axios.get('https://api.map.baidu.com/traffic/v1/around', {
                params: {
                    ak: apiKey,
                    location: `${lat},${lng}`,
                    radius: 1000,
                    coord_type_input: 'bd09ll',
                    coord_type_output: 'bd09ll',
                    output: 'json'
                },
                timeout: 60000
            });

            if (response.data?.status === 0) {
                const roads = response.data.road_traffic || [];
                if (roads.length === 0) return null;

                const congestionValues = roads
                    .map(r => r?.congestion)
                    .filter(v => typeof v === 'number');

                if (congestionValues.length === 0) return null;

                const avg = congestionValues.reduce((a, b) => a + b, 0) / congestionValues.length;
                return this.mapCongestion(avg);
            }
        } catch (error) {
            return null;
        }

        return null;
    }

    mapCongestion(value) {
        if (value <= 2) return '畅通';
        if (value <= 4) return '轻度拥堵';
        if (value <= 6) return '中度拥堵';
        return '严重拥堵';
    }

    congestionFromSpeed(speedKmh) {
        if (speedKmh >= 40) return '畅通';
        if (speedKmh >= 25) return '轻度拥堵';
        if (speedKmh >= 15) return '中度拥堵';
        return '严重拥堵';
    }

    scoreCongestion(label) {
        switch (label) {
            case '畅通':
                return 0;
            case '轻度拥堵':
                return 5;
            case '中度拥堵':
                return 10;
            case '严重拥堵':
                return 20;
            default:
                return 8;
        }
    }

    matchIndoor(name) {
        return LARGE_MALL_REGEX.test(name || '');
    }

    matchMetro(name) {
        return METRO_REGEX.test(name || '');
    }

    matchParking(name) {
        return PARKING_REGEX.test(name || '');
    }

    getReputationScore(name = '') {
        return REPUTATION_REGEX.test(name) ? -4 : 2;
    }

    buildReputationReason(name = '') {
        if (REPUTATION_REGEX.test(name)) {
            return '口碑：知名连锁/综合体，体验更稳定';
        }
        return '口碑：暂无明显加分';
    }

    buildWeatherReason(name, weather) {
        if (!weather) return '天气：未知';

        const indoor = this.matchIndoor(name);
        const metro = this.matchMetro(name);
        const parking = this.matchParking(name);

        if (!weather.isBad) {
            return `天气：${weather.text}天基本适配`;
        }

        const fits = [];
        if (metro) fits.push('近地铁');
        if (indoor) fits.push('室内区域');
        if (parking) fits.push('停车方便');

        if (fits.length === 0) {
            return `天气：${weather.text}天适配性低`;
        }

        return `天气：${weather.text}天适配（${fits.join(' / ')}）`;
    }

    async computeCandidateMetrics(candidate, participants) {
        let totalDuration = 0;
        let totalDistance = 0;
        let totalRoutes = 0;

        for (const person of participants) {
            await this.delay(120);
            const origin = `${person.lng},${person.lat}`;
            const destination = `${candidate.lng},${candidate.lat}`;
            const mode = person.transportMode || 'driving';

            try {
                const route = await amapService.calculateRoute({
                    origin,
                    destination,
                    mode,
                    city: person.city || candidate.city || '北京'
                });

                totalDuration += route.duration;
                totalDistance += route.distance;
                totalRoutes += 1;
            } catch (error) {
                const distance = geoUtils.calculateDistance(
                    { lng: person.lng, lat: person.lat },
                    { lng: candidate.lng, lat: candidate.lat }
                );
                const speedKmh = SPEED_MAP[mode] || 30;
                const speedMs = (speedKmh * 1000) / 3600;
                const duration = Math.round(distance / speedMs + 300);

                totalDuration += duration;
                totalDistance += Math.round(distance);
                totalRoutes += 1;
            }
        }

        const durationMinutes = totalDuration / 60;
        const avgSpeedKmh = totalDuration > 0 ? (totalDistance / totalDuration) * 3.6 : 0;
        return {
            totalDurationMinutes: Math.round(durationMinutes),
            avgSpeedKmh,
            congestionLabel: this.congestionFromSpeed(avgSpeedKmh)
        };
    }

    async decide({ city, districtId, participants, candidates }) {
        if (!city) throw new Error('缺少城市');
        if (!participants?.length) throw new Error('缺少参会者位置');
        if (!candidates?.length) throw new Error('缺少候选点');

        const resolvedDistrictId = districtId || process.env.BMAP_WEATHER_DISTRICT_ID;
        const weather = await this.getWeather(resolvedDistrictId);

        const results = [];
        const filteredCandidates = candidates.filter(c => !/采样点/.test(c.name || ''));
        if (filteredCandidates.length === 0) {
            throw new Error('候选点为空或全为采样点');
        }

        for (const candidate of filteredCandidates) {
            await this.delay(150);
            const metrics = await this.computeCandidateMetrics(candidate, participants);

            let congestionLabel = await this.getTrafficAround(candidate.lng, candidate.lat);
            if (!congestionLabel) {
                congestionLabel = metrics.congestionLabel;
            }

            const trafficScore = metrics.totalDurationMinutes + this.scoreCongestion(congestionLabel);
            const weatherScore = weather.isBad
                ? (this.matchIndoor(candidate.name) || this.matchMetro(candidate.name) || this.matchParking(candidate.name) ? -5 : 5)
                : 0;

            const reputationScore = this.getReputationScore(candidate.name);

            const finalScore = trafficScore * 0.7 + weatherScore * 0.3 + reputationScore * 0.2;

            const trafficReason = `路况：总通行 ${metrics.totalDurationMinutes} 分钟 + 周边${congestionLabel}`;
            const weatherReason = this.buildWeatherReason(candidate.name, weather);
            const reputationReason = this.buildReputationReason(candidate.name);

            results.push({
                name: candidate.name,
                score: finalScore,
                reason: `${trafficReason}；${weatherReason}；${reputationReason}`,
                trafficReason,
                weatherReason,
                reputationReason,
                totalDurationMinutes: metrics.totalDurationMinutes,
                congestionLabel
            });
        }

        results.sort((a, b) => a.score - b.score);

        const top3 = results.slice(0, 3);
        const best = top3[0];

        const output = {
            最优候选点: best?.name || '',
            候选点排序: top3.map(item => item.name),
            各点决策依据: top3.reduce((acc, item) => {
                acc[item.name] = item.reason;
                return acc;
            }, {}),
            核心推荐理由: best ? `综合路况与天气，${best.trafficReason}；${best.weatherReason}；${best.reputationReason}` : '',
            人性化总结: best
                ? `综合路况与天气，当前更推荐「${best.name}」，通行时间更短且周边拥堵更低；如果天气偏差较大，也优先考虑有室内/交通便利的商圈点。`
                : ''
        };

        return output;
    }
}

module.exports = new AiAutoDecisionService();
