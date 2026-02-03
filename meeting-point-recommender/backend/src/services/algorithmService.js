/**
 * 会面点推荐核心算法服务
 */

const amapService = require('./amapService');
const geoUtils = require('../utils/geoUtils');

// 不同出行方式的速度（km/h）
const SPEED_MAP = {
    walking: 5,
    bicycling: 15,
    transit: 25,
    driving: 40
};

class AlgorithmService {
    /**
     * 主入口：查找最优会面点
     */
    async findOptimalMeetingPoint(persons, options = {}) {
        const {
            maxCandidates = 30,
            poiTypes = ['餐饮服务', '咖啡厅', '购物服务'],
            city = '北京'
        } = options;

        console.log(`开始计算会面点，共 ${persons.length} 人`);

        // 1. 计算加权中心点
        const weightedCenter = this.calculateWeightedCenter(persons);
        console.log('加权中心点:', weightedCenter);

        // 2. 生成候选点
        const candidates = await this.generateCandidatePoints(
            weightedCenter,
            poiTypes,
            maxCandidates
        );
        console.log(`生成候选点 ${candidates.length} 个`);

        // 3. 评分候选点
        const scoredCandidates = await this.scoreCandidates(candidates, persons, city);
        console.log(`完成评分，有效候选点 ${scoredCandidates.length} 个`);

        // 4. 返回前3个最优点
        return scoredCandidates.slice(0, 3);
    }

    /**
     * 计算加权中心点
     * 速度越慢的人权重越高（需要更靠近慢速交通的人）
     */
    calculateWeightedCenter(persons) {
        let totalWeight = 0;
        let weightedLng = 0;
        let weightedLat = 0;

        persons.forEach(person => {
            const speed = SPEED_MAP[person.transportMode] || 20;
            const weight = 1 / speed; // 速度越慢权重越高

            weightedLng += person.lng * weight;
            weightedLat += person.lat * weight;
            totalWeight += weight;
        });

        return {
            lng: weightedLng / totalWeight,
            lat: weightedLat / totalWeight
        };
    }

    /**
     * 生成候选点
     */
    async generateCandidatePoints(center, poiTypes, maxCandidates) {
        const candidates = [];

        // 策略1: 加权中心点本身
        candidates.push({
            id: 'center',
            lng: center.lng,
            lat: center.lat,
            name: '加权中心点',
            address: '',
            type: 'center'
        });

        // 策略2: 周边 POI 搜索
        const searchRadii = [500, 1000, 2000];

        for (const radius of searchRadii) {
            for (const type of poiTypes) {
                try {
                    const pois = await amapService.searchPOI({
                        location: `${center.lng},${center.lat}`,
                        keywords: type,
                        radius: radius,
                        offset: 5
                    });

                    for (const poi of pois) {
                        // 避免重复
                        const exists = candidates.some(c =>
                            Math.abs(c.lng - poi.lng) < 0.0001 &&
                            Math.abs(c.lat - poi.lat) < 0.0001
                        );
                        if (!exists) {
                            candidates.push({
                                id: poi.id,
                                lng: poi.lng,
                                lat: poi.lat,
                                name: poi.name,
                                address: poi.address,
                                type: poi.type
                            });
                        }
                    }

                    if (candidates.length >= maxCandidates) {
                        return candidates.slice(0, maxCandidates);
                    }
                } catch (error) {
                    console.error(`POI搜索失败 (${type}, ${radius}m):`, error.message);
                }
            }
        }

        // 策略3: 如果 POI 不够，添加均匀采样点
        if (candidates.length < 10) {
            const directions = [0, 90, 180, 270];
            const distances = [500, 1000];

            directions.forEach(angle => {
                distances.forEach(dist => {
                    const point = geoUtils.calculateDestination(center, dist, angle);
                    candidates.push({
                        id: `sample_${angle}_${dist}`,
                        lng: point.lng,
                        lat: point.lat,
                        name: `采样点`,
                        address: '',
                        type: 'sample'
                    });
                });
            });
        }

        return candidates.slice(0, maxCandidates);
    }

    /**
     * 评分候选点
     */
    async scoreCandidates(candidates, persons, city) {
        const scoredCandidates = [];

        for (const candidate of candidates) {
            try {
                const routeInfos = [];

                // 并发计算每个人到候选点的路线
                const routePromises = persons.map(async (person) => {
                    try {
                        const route = await amapService.calculateRoute({
                            origin: `${person.lng},${person.lat}`,
                            destination: `${candidate.lng},${candidate.lat}`,
                            mode: person.transportMode,
                            city: city
                        });

                        return {
                            personId: person.id,
                            personName: person.name,
                            transportMode: person.transportMode,
                            duration: route.duration,
                            distance: route.distance,
                            arrivalTime: (person.departureTime || Date.now()) + route.duration * 1000,
                            polyline: route.polyline
                        };
                    } catch (error) {
                        console.error(`路径计算失败 (${person.name} -> ${candidate.name}):`, error.message);
                        return null;
                    }
                });

                const results = await Promise.all(routePromises);

                // 过滤失败的路线
                for (const result of results) {
                    if (result) {
                        routeInfos.push(result);
                    }
                }

                // 如果有人无法到达，跳过此候选点
                if (routeInfos.length !== persons.length) {
                    continue;
                }

                // 计算评分指标
                const arrivalTimes = routeInfos.map(r => r.arrivalTime);
                const durations = routeInfos.map(r => r.duration);
                const distances = routeInfos.map(r => r.distance);

                const maxTimeDiff = (Math.max(...arrivalTimes) - Math.min(...arrivalTimes)) / 1000; // 秒
                const timeVariance = this.calculateVariance(durations);
                const avgDuration = this.average(durations);
                const totalDistance = this.sum(distances);

                // 综合评分（分数越低越好）
                // 权重: 时间差异40% + 最大时间差30% + 平均时长20% + 总距离10%
                const score =
                    (timeVariance / 10000) * 0.4 +
                    (maxTimeDiff / 60) * 0.3 +
                    (avgDuration / 60) * 0.2 +
                    (totalDistance / 1000) * 0.1;

                scoredCandidates.push({
                    id: candidate.id,
                    name: candidate.name,
                    address: candidate.address,
                    type: candidate.type,
                    lng: candidate.lng,
                    lat: candidate.lat,
                    score: Math.round(score * 100) / 100,
                    routeInfos,
                    metrics: {
                        maxTimeDiff: Math.round(maxTimeDiff),
                        timeVariance: Math.round(timeVariance),
                        avgDuration: Math.round(avgDuration),
                        totalDistance: Math.round(totalDistance),
                        maxArrivalTime: Math.max(...arrivalTimes),
                        minArrivalTime: Math.min(...arrivalTimes)
                    }
                });
            } catch (error) {
                console.error(`候选点评分失败 (${candidate.name}):`, error.message);
            }
        }

        // 按分数升序排列
        return scoredCandidates.sort((a, b) => a.score - b.score);
    }

    /**
     * 计算方差
     */
    calculateVariance(values) {
        const avg = this.average(values);
        const squareDiffs = values.map(v => Math.pow(v - avg, 2));
        return this.average(squareDiffs);
    }

    /**
     * 计算平均值
     */
    average(arr) {
        if (arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    /**
     * 求和
     */
    sum(arr) {
        return arr.reduce((a, b) => a + b, 0);
    }
}

module.exports = new AlgorithmService();
