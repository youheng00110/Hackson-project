/**
 * 后端 API 服务
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json'
    }
});

/**
 * 计算最优会面点
 */
export async function findMeetingPoint(persons, options = {}) {
    const response = await api.post('/meeting-point/calculate', {
        persons,
        options
    });
    return response.data;
}

/**
 * 地理编码
 */
export async function geocode(address, city = '') {
    const response = await api.post('/geocode', {
        address,
        city
    });
    return response.data;
}

/**
 * 逆地理编码
 */
export async function reverseGeocode(lng, lat) {
    const response = await api.post('/reverse-geocode', {
        lng,
        lat
    });
    return response.data;
}

/**
 * POI 搜索
 */
export async function searchPOI(location, keywords, radius = 1000) {
    const response = await api.post('/poi/search', {
        location,
        keywords,
        radius
    });
    return response.data;
}

export default api;
