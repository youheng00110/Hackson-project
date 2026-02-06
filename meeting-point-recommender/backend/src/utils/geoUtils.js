/**
 * 地理计算工具函数
 */

const EARTH_RADIUS = 6371000; // 地球半径（米）

/**
 * 角度转弧度
 */
function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * 弧度转角度
 */
function toDegrees(radians) {
    return radians * 180 / Math.PI;
}

/**
 * 根据起点、距离、方向计算目标点
 * @param {Object} start - {lng, lat}
 * @param {number} distance - 距离(米)
 * @param {number} bearing - 方向角(度)
 * @returns {Object} {lng, lat}
 */
function calculateDestination(start, distance, bearing) {
    const lat1 = toRadians(start.lat);
    const lng1 = toRadians(start.lng);
    const brng = toRadians(bearing);

    const lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(distance / EARTH_RADIUS) +
        Math.cos(lat1) * Math.sin(distance / EARTH_RADIUS) * Math.cos(brng)
    );

    const lng2 = lng1 + Math.atan2(
        Math.sin(brng) * Math.sin(distance / EARTH_RADIUS) * Math.cos(lat1),
        Math.cos(distance / EARTH_RADIUS) - Math.sin(lat1) * Math.sin(lat2)
    );

    return {
        lat: toDegrees(lat2),
        lng: toDegrees(lng2)
    };
}

/**
 * 计算两点间距离(米) - Haversine公式
 */
function calculateDistance(point1, point2) {
    const lat1 = toRadians(point1.lat);
    const lat2 = toRadians(point2.lat);
    const deltaLat = toRadians(point2.lat - point1.lat);
    const deltaLng = toRadians(point2.lng - point1.lng);

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS * c;
}

/**
 * 计算多个点的几何中心
 */
function calculateGeometricCenter(points) {
    const n = points.length;
    const sumLng = points.reduce((sum, p) => sum + p.lng, 0);
    const sumLat = points.reduce((sum, p) => sum + p.lat, 0);

    return {
        lng: sumLng / n,
        lat: sumLat / n
    };
}

module.exports = {
    calculateDestination,
    calculateDistance,
    calculateGeometricCenter,
    toRadians,
    toDegrees
};
