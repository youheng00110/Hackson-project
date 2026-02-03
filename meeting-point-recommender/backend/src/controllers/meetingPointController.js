/**
 * 会面点 API 控制器
 */

const algorithmService = require('../services/algorithmService');
const amapService = require('../services/amapService');

class MeetingPointController {
    /**
     * 计算最优会面点
     * POST /api/meeting-point/calculate
     */
    async calculate(req, res) {
        try {
            const startTime = Date.now();
            const { persons, options = {} } = req.body;

            // 参数验证
            if (!persons || !Array.isArray(persons)) {
                return res.status(400).json({
                    success: false,
                    error: '请提供人员信息数组'
                });
            }

            if (persons.length < 2) {
                return res.status(400).json({
                    success: false,
                    error: '至少需要2个人才能计算会面点'
                });
            }

            // 验证每个人的必要字段
            for (let i = 0; i < persons.length; i++) {
                const person = persons[i];
                if (!person.lng || !person.lat) {
                    return res.status(400).json({
                        success: false,
                        error: `第 ${i + 1} 个人缺少位置信息 (lng/lat)`
                    });
                }
                if (!person.transportMode) {
                    return res.status(400).json({
                        success: false,
                        error: `第 ${i + 1} 个人缺少出行方式 (transportMode)`
                    });
                }
                // 设置默认值
                person.id = person.id || `person_${i + 1}`;
                person.name = person.name || `用户${i + 1}`;
                person.departureTime = person.departureTime || Date.now();
            }

            // 调用算法服务
            const meetingPoints = await algorithmService.findOptimalMeetingPoint(
                persons,
                options
            );

            const calculationTime = Date.now() - startTime;

            res.json({
                success: true,
                data: {
                    meetingPoints,
                    calculationTime,
                    personsCount: persons.length
                }
            });
        } catch (error) {
            console.error('计算会面点失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '计算失败，请重试'
            });
        }
    }

    /**
     * 地理编码
     * POST /api/geocode
     */
    async geocode(req, res) {
        try {
            const { address, city } = req.body;

            if (!address) {
                return res.status(400).json({
                    success: false,
                    error: '请提供地址'
                });
            }

            const result = await amapService.geocode(address, city || '');

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('地理编码失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '地址解析失败'
            });
        }
    }

    /**
     * 逆地理编码
     * POST /api/reverse-geocode
     */
    async reverseGeocode(req, res) {
        try {
            const { lng, lat } = req.body;

            if (lng === undefined || lat === undefined) {
                return res.status(400).json({
                    success: false,
                    error: '请提供经纬度坐标'
                });
            }

            const result = await amapService.reverseGeocode(lng, lat);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('逆地理编码失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || '坐标解析失败'
            });
        }
    }

    /**
     * POI 搜索
     * POST /api/poi/search
     */
    async searchPOI(req, res) {
        try {
            const { location, keywords, radius = 1000, offset = 20 } = req.body;

            if (!location) {
                return res.status(400).json({
                    success: false,
                    error: '请提供中心点位置'
                });
            }

            const result = await amapService.searchPOI({
                location,
                keywords: keywords || '',
                radius,
                offset
            });

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('POI搜索失败:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'POI搜索失败'
            });
        }
    }
}

module.exports = new MeetingPointController();
