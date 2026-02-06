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
    public_transport: 25,
    driving: 40
};

// 商场类关键词扩展（提升精细地点命中率）
const MALL_KEYWORD_EXPANSION = [
    '万达广场',
    '万达',
    '万象城',
    '大悦城',
    '吾悦广场',
    '龙湖天街',
    '奥特莱斯',
    '购物中心',
    '购物广场',
    '城市广场',
    '商场',
    '百货',
    '商贸城',
    '银泰'
];

const MALL_KEYWORD_REGEX = /商场|购物|购物中心|百货|购物服务|mall/i;
const MALL_RESULT_REGEX = /购物中心|商场|百货|广场|mall|plaza|center|中心/i;
const GOV_RESULT_REGEX = /政府|公安|派出所|检察|法院|税务|工商|民政|城管|执法|监管|市场监督|监局|社区|街道办|委员会|大队|支队|总队|机关|管理局|行政|事业单位/i;

// 餐饮类关键词扩展（提升品牌店命中率）
const RESTAURANT_KEYWORD_EXPANSION = [
    '海底捞',
    '海底捞火锅',
    '火锅',
    '肯德基',
    '麦当劳',
    '星巴克',
    '必胜客',
    '小肥羊',
    '呷哺呷哺',
    '西贝',
    '汉堡王',
    '喜茶',
    '奈雪',
    '瑞幸',
    '蜜雪冰城'
];

const RESTAURANT_KEYWORD_REGEX = /餐厅|餐饮|美食|餐饮服务|火锅|烧烤|小吃|饭店|restaurant/i;

class AlgorithmService {
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    isShoppingKeyword(keyword = '') {
        return MALL_KEYWORD_REGEX.test(keyword);
    }

    isMallPoi(poi) {
        const name = poi?.name || '';
        const tag = poi?.type || '';
        if (GOV_RESULT_REGEX.test(name) || GOV_RESULT_REGEX.test(tag)) {
            return false;
        }
        return MALL_RESULT_REGEX.test(name) || MALL_RESULT_REGEX.test(tag) || this.isLargeMallName(name);
    }
    /**
     * 是否大型商场名称
     */
    isLargeMallName(name = '') {
        if (!name) return false;
        return /(万达广场|万象城|大悦城|吾悦广场|龙湖天街|奥特莱斯|银泰|印象城|来福士|合生汇|恒隆广场|正大广场|环球港|世贸|国贸|城市广场|购物中心|中心广场|广场购物中心)/i.test(name);
    }

    /**
     * 是否小型零售/小超市/便利店等
     */
    isSmallRetailName(name = '') {
        if (!name) return false;
        return /(便利店|小卖部|小超市|超市|生鲜|菜市场|小店|杂货|士多|粮油|便民|折扣店)/i.test(name);
    }

    /**
     * 扩展 POI 关键词（提升商场类精细命中）
     */
    expandPoiKeywords(poiTypes = []) {
        const normalized = new Set();

        poiTypes.forEach((type) => {
            if (!type) return;
            normalized.add(type);

            if (MALL_KEYWORD_REGEX.test(type)) {
                MALL_KEYWORD_EXPANSION.forEach(keyword => normalized.add(keyword));
            }

            if (RESTAURANT_KEYWORD_REGEX.test(type)) {
                RESTAURANT_KEYWORD_EXPANSION.forEach(keyword => normalized.add(keyword));
            }
        });

        return Array.from(normalized);
    }

    /**
     * 主入口：查找最优会面点
     */
    async findOptimalMeetingPoint(persons, options = {}) {
        const {
            maxCandidates = 30,
            poiTypes = ['餐饮服务', '咖啡厅', '购物服务'],
            city = '北京',
            searchRadius = 3000,
            objective = 'balanced'
        } = options;

        const expandedPoiTypes = this.expandPoiKeywords(poiTypes);

        console.log(`开始计算会面点，共 ${persons.length} 人`);

        // 1. 计算加权中心点
        const weightedCenter = this.calculateWeightedCenter(persons);
        console.log('加权中心点:', weightedCenter);

        // 2. 生成候选点
        const candidates = await this.generateCandidatePoints(
            weightedCenter,
            expandedPoiTypes,
            maxCandidates,
            searchRadius
        );
        console.log(`生成候选点 ${candidates.length} 个`);

        // 3. 评分候选点
        const scoredCandidates = await this.scoreCandidates(candidates, persons, city, objective);
        console.log(`完成评分，有效候选点 ${scoredCandidates.length} 个`);

            // 4. 返回前5个最优点
            return scoredCandidates.slice(0, 5);
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
    async generateCandidatePoints(center, poiTypes, maxCandidates, searchRadius) {
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
        const radius = Math.max(500, Number(searchRadius) || 3000);
        const searchRadii = [
            Math.round(radius * 0.35),
            Math.round(radius * 0.7),
            radius
        ].filter((value, index, arr) => value >= 300 && arr.indexOf(value) === index);

        for (const radius of searchRadii) {
            for (const type of poiTypes) {
                try {
                    const pois = await amapService.searchPOI({
                        location: `${center.lng},${center.lat}`,
                        keywords: type,
                        radius: radius,
                        offset: 20
                    });

                    const filteredPois = this.isShoppingKeyword(type)
                        ? pois.filter(p => this.isMallPoi(p))
                        : pois.filter(p => !GOV_RESULT_REGEX.test(p?.name || '') && !GOV_RESULT_REGEX.test(p?.type || ''));

                    for (const poi of filteredPois) {
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

        // 策略3: 如果 POI 不够，扩大半径再搜索
        if (candidates.length === 0) {
            const expandedRadii = [radius * 1.5, radius * 2, radius * 3];
            for (const expandRadius of expandedRadii) {
                for (const type of poiTypes) {
                    try {
                        const pois = await amapService.searchPOI({
                            location: `${center.lng},${center.lat}`,
                            keywords: type,
                            radius: Math.round(expandRadius),
                            offset: 20
                        });

                        const filteredPois = this.isShoppingKeyword(type)
                            ? pois.filter(p => this.isMallPoi(p))
                            : pois.filter(p => !GOV_RESULT_REGEX.test(p?.name || '') && !GOV_RESULT_REGEX.test(p?.type || ''));

                        for (const poi of filteredPois) {
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
                        console.error(`POI搜索失败 (${type}, ${Math.round(expandRadius)}m):`, error.message);
                    }
                }
            }
        }

        // 策略4: 如果仍不足，添加更大范围采样点
        if (candidates.length < 10) {
            const directions = [0, 45, 90, 135, 180, 225, 270, 315];
            const distances = [
                Math.round(radius * 0.3),
                Math.round(radius * 0.6),
                Math.round(radius * 0.9)
            ].filter(d => d >= 300);

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
    async scoreCandidates(candidates, persons, city, objective = 'balanced') {
        const scoredCandidates = [];

        for (const candidate of candidates) {
            if (candidate.type === 'sample') {
                continue;
            }
            try {
                const routeInfos = [];

                // 串行计算每个人到候选点的路线（降低并发）
                for (const person of persons) {
                    await this.delay(120);
                    try {
                        const route = await amapService.calculateRoute({
                            origin: `${person.lng},${person.lat}`,
                            destination: `${candidate.lng},${candidate.lat}`,
                            mode: person.transportMode,
                            city: city
                        });

                        routeInfos.push({
                            personId: person.id,
                            personName: person.name,
                            transportMode: person.transportMode,
                            duration: route.duration,
                            distance: route.distance,
                            arrivalTime: (person.departureTime || Date.now()) + route.duration * 1000,
                            polyline: route.polyline
                        });
                    } catch (error) {
                        console.error(`路径计算失败 (${person.name} -> ${candidate.name}):`, error.message);
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
                const maxDuration = Math.max(...durations);
                const minDuration = Math.min(...durations);
                const maxDistance = Math.max(...distances);
                const minDistance = Math.min(...distances);

                const timeGapRatio = maxDuration > 0 ? (maxDuration - minDuration) / maxDuration : 0;
                const distanceGapRatio = maxDistance > 0 ? (maxDistance - minDistance) / maxDistance : 0;

                const balancedScore =
                    (timeVariance / 10000) * 0.4 +
                    (maxTimeDiff / 60) * 0.3 +
                    (avgDuration / 60) * 0.2 +
                    (totalDistance / 1000) * 0.1;

                let score = balancedScore;
                if (objective === 'time_gap') {
                    score = timeGapRatio;
                } else if (objective === 'distance_gap') {
                    score = distanceGapRatio;
                }

                let adjustedScore = score;

                // 大型商场优先（分数越低越优先）
                if (this.isLargeMallName(candidate.name)) {
                    adjustedScore = Math.max(0, score * 0.5 - 0.3);
                }

                // 小型零售/小超市降权
                if (this.isSmallRetailName(candidate.name)) {
                    adjustedScore = adjustedScore + 1.5;
                }

                scoredCandidates.push({
                    id: candidate.id,
                    name: candidate.name,
                    address: candidate.address,
                    type: candidate.type,
                    lng: candidate.lng,
                    lat: candidate.lat,
                    score: Math.round(adjustedScore * 100) / 100,
                    routeInfos,
                    metrics: {
                        maxTimeDiff: Math.round(maxTimeDiff),
                        timeVariance: Math.round(timeVariance),
                        avgDuration: Math.round(avgDuration),
                        totalDistance: Math.round(totalDistance),
                        timeGapRatio: Math.round(timeGapRatio * 100) / 100,
                        distanceGapRatio: Math.round(distanceGapRatio * 100) / 100,
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
