/**
 * 百度地图 API 服务封装
 */

const axios = require('axios');
const config = require('../config/amapConfig');

class BmapService {
    constructor() {
        this.apiKey = config.serverKey;
        this.baseUrl = config.baseUrl;
    }

    /**
     * 驾车路径规划
     */
    async getDrivingRoute(origin, destination) {
        try {
            const response = await axios.get(`${this.baseUrl}/directionlite/v1/driving`, {
                params: {
                    ak: this.apiKey,
                    origin: origin,
                    destination: destination,
                    coord_type: 'bd09ll',
                    ret_coordtype: 'bd09ll'
                }
            });

            if (response.data.status === 0 && response.data.result?.routes?.length > 0) {
                const route = response.data.result.routes[0];
                return {
                    distance: parseInt(route.distance),
                    duration: parseInt(route.duration),
                    polyline: this.parsePolyline(route.steps)
                };
            }
            throw new Error(response.data.message || '驾车路径规划失败');
        } catch (error) {
            console.error('驾车路径规划失败:', error.message);
            throw error;
        }
    }

    /**
     * 步行路径规划
     */
    async getWalkingRoute(origin, destination) {
        try {
            const response = await axios.get(`${this.baseUrl}/directionlite/v1/walking`, {
                params: {
                    ak: this.apiKey,
                    origin: origin,
                    destination: destination,
                    coord_type: 'bd09ll',
                    ret_coordtype: 'bd09ll'
                }
            });

            if (response.data.status === 0 && response.data.result?.routes?.length > 0) {
                const route = response.data.result.routes[0];
                return {
                    distance: parseInt(route.distance),
                    duration: parseInt(route.duration),
                    polyline: this.parsePolyline(route.steps)
                };
            }
            throw new Error(response.data.message || '步行路径规划失败');
        } catch (error) {
            console.error('步行路径规划失败:', error.message);
            throw error;
        }
    }

    /**
     * 骑行路径规划
     */
    async getBicyclingRoute(origin, destination) {
        try {
            const response = await axios.get(`${this.baseUrl}/directionlite/v1/riding`, {
                params: {
                    ak: this.apiKey,
                    origin: origin,
                    destination: destination,
                    coord_type: 'bd09ll',
                    ret_coordtype: 'bd09ll'
                }
            });

            if (response.data.status === 0 && response.data.result?.routes?.length > 0) {
                const route = response.data.result.routes[0];
                return {
                    distance: parseInt(route.distance),
                    duration: parseInt(route.duration),
                    polyline: this.parsePolyline(route.steps)
                };
            }
            throw new Error(response.data.message || '骑行路径规划失败');
        } catch (error) {
            console.error('骑行路径规划失败:', error.message);
            throw error;
        }
    }

    /**
     * 公交路径规划
     */
    async getTransitRoute(origin, destination, city) {
        try {
            const response = await axios.get(`${this.baseUrl}/directionlite/v1/transit`, {
                params: {
                    ak: this.apiKey,
                    origin: origin,
                    destination: destination,
                    coord_type: 'bd09ll',
                    ret_coordtype: 'bd09ll'
                }
            });

            if (response.data.status === 0 && response.data.result?.routes?.length > 0) {
                const route = response.data.result.routes[0];
                // 解析公交路径的polyline
                const polyline = this.parseTransitPolyline(route.steps);
                return {
                    distance: parseInt(route.distance || 0),
                    duration: parseInt(route.duration),
                    polyline: polyline
                };
            }
            throw new Error(response.data.message || '公交路径规划失败');
        } catch (error) {
            console.error('公交路径规划失败:', error.message);
            throw error;
        }
    }

    /**
     * 统一路径规划接口
     * 注意：百度地图API坐标格式为 "lat,lng"，需要将前端的 "lng,lat" 转换
     * 坐标系：使用BD09坐标系（百度坐标），与前端百度地图SDK保持一致
     */
    async calculateRoute({ origin, destination, mode, city = '北京' }) {
        // 转换坐标格式：从 "lng,lat" 转为 "lat,lng"
        const convertCoord = (coord) => {
            const [lng, lat] = coord.split(',');
            return `${lat},${lng}`;
        };

        const bmapOrigin = convertCoord(origin);
        const bmapDest = convertCoord(destination);

        switch (mode) {
            case 'walking':
                return await this.getWalkingRoute(bmapOrigin, bmapDest);
            case 'bicycling':
                return await this.getBicyclingRoute(bmapOrigin, bmapDest);
            case 'transit':
                return await this.getTransitRoute(bmapOrigin, bmapDest, city);
            case 'driving':
                return await this.getDrivingRoute(bmapOrigin, bmapDest);
            default:
                throw new Error(`不支持的出行方式: ${mode}`);
        }
    }

    /**
     * POI 周边搜索
     */
    async searchPOI({ location, keywords, radius = 1000, offset = 20 }) {
        try {
            // 转换坐标格式
            const [lng, lat] = location.split(',');
            const bmapLocation = `${lat},${lng}`;

            const response = await axios.get(`${this.baseUrl}/place/v2/search`, {
                params: {
                    ak: this.apiKey,
                    query: keywords || '餐饮',
                    location: bmapLocation,
                    radius: radius,
                    output: 'json',
                    scope: 2,
                    page_size: offset,
                    coord_type: 2,
                    ret_coordtype: 'gcj02ll'
                }
            });

            if (response.data.status === 0) {
                return (response.data.results || []).map(poi => {
                    return {
                        id: poi.uid,
                        name: poi.name,
                        type: poi.detail_info?.tag || '',
                        address: poi.address || '',
                        lng: poi.location.lng,
                        lat: poi.location.lat,
                        distance: poi.detail_info?.distance || 0
                    };
                });
            }
            throw new Error(response.data.message || 'POI搜索失败');
        } catch (error) {
            console.error('POI搜索失败:', error.message);
            return [];
        }
    }

    /**
     * 地理编码 - 地址转坐标
     */
    async geocode(address, city) {
        try {
            const response = await axios.get(`${this.baseUrl}/geocoding/v3/`, {
                params: {
                    ak: this.apiKey,
                    address: address,
                    city: city,
                    output: 'json',
                    ret_coordtype: 'gcj02ll'
                }
            });

            if (response.data.status === 0 && response.data.result) {
                return {
                    lng: response.data.result.location.lng,
                    lat: response.data.result.location.lat
                };
            }
            throw new Error('地址解析失败');
        } catch (error) {
            console.error('地理编码失败:', error.message);
            throw error;
        }
    }

    /**
     * 逆地理编码 - 坐标转地址
     */
    async reverseGeocode(lng, lat) {
        try {
            const response = await axios.get(`${this.baseUrl}/reverse_geocoding/v3/`, {
                params: {
                    ak: this.apiKey,
                    location: `${lat},${lng}`,
                    output: 'json',
                    coordtype: 'gcj02ll',
                    ret_coordtype: 'gcj02ll'
                }
            });

            if (response.data.status === 0 && response.data.result) {
                const result = response.data.result;
                return {
                    formattedAddress: result.formatted_address,
                    province: result.addressComponent?.province || '',
                    city: result.addressComponent?.city || '',
                    district: result.addressComponent?.district || ''
                };
            }
            throw new Error('坐标解析失败');
        } catch (error) {
            console.error('逆地理编码失败:', error.message);
            throw error;
        }
    }

    /**
     * 从步骤中提取polyline
     */
    parsePolyline(steps) {
        if (!steps || !Array.isArray(steps)) return [];
        const polylines = [];
        steps.forEach(step => {
            if (step.path) {
                const points = step.path.split(';');
                points.forEach(point => {
                    const [lng, lat] = point.split(',');
                    if (lng && lat) {
                        polylines.push([parseFloat(lng), parseFloat(lat)]);
                    }
                });
            }
        });
        return polylines;
    }

    /**
     * 解析公交路径的polyline
     * 公交路径是二维数组：steps[i][j].path
     */
    parseTransitPolyline(steps) {
        if (!steps || !Array.isArray(steps)) return [];
        const polylines = [];

        // steps 是二维数组，遍历每个步骤组
        steps.forEach(stepGroup => {
            if (!Array.isArray(stepGroup)) return;

            // 遍历步骤组中的每个步骤
            stepGroup.forEach(step => {
                if (step && step.path) {
                    const points = step.path.split(';');
                    points.forEach(point => {
                        const [lng, lat] = point.split(',');
                        if (lng && lat) {
                            polylines.push([parseFloat(lng), parseFloat(lat)]);
                        }
                    });
                }
            });
        });

        return polylines;
    }
}

module.exports = new BmapService();
