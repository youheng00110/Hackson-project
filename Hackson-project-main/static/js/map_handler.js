/**
 * 地图操作封装模块
 * 负责百度地图的初始化、标记管理、路线绘制等功能
 */

class MapHandler {
    constructor() {
        this.map = null;
        this.personMarkers = {};  // 人员标记 {personId: marker}
        this.meetingMarkers = []; // 会面点标记
        this.centerMarker = null; // 中心点标记
        this.routeOverlays = [];  // 路线覆盖物
        this.pickingCallback = null; // 地图选点回调
        // 更现代的渐变色系
        this.colors = [
            '#667eea', // 紫蓝
            '#f093fb', // 粉紫
            '#4facfe', // 天蓝
            '#43e97b', // 青绿
            '#fa709a', // 玫红
            '#fee140', // 金黄
            '#30cfd0', // 青色
            '#a8edea', // 薄荷
            '#ff9a9e', // 珊瑚
            '#fbc2eb'  // 淡粉
        ];
    }

    /**
     * 初始化地图
     */
    init(containerId, centerLng = 116.404, centerLat = 39.915) {
        if (typeof BMap === 'undefined') {
            console.error('百度地图 API 未加载');
            document.getElementById(containerId).innerHTML = 
                '<div style="padding: 50px; text-align: center; color: #ef4444; background: #1a1a2e;">' +
                '<div style="font-size: 48px; margin-bottom: 20px;">🗺️</div>' +
                '<div style="font-size: 16px;">地图加载失败</div>' +
                '<div style="font-size: 13px; color: #888; margin-top: 10px;">请检查网络连接和 API Key</div></div>';
            return false;
        }

        this.map = new BMap.Map(containerId);
        const point = new BMap.Point(centerLng, centerLat);
        this.map.centerAndZoom(point, 12);
        this.map.enableScrollWheelZoom(true);

        // 设置地图样式为深色主题
        this.map.setMapStyleV2({
            styleId: '5510012371f0e61e78a14926f9e2dd10'  // 百度地图深色样式
        });

        // 添加控件
        const navControl = new BMap.NavigationControl({
            anchor: BMAP_ANCHOR_TOP_RIGHT,
            type: BMAP_NAVIGATION_CONTROL_ZOOM
        });
        this.map.addControl(navControl);
        this.map.addControl(new BMap.ScaleControl());

        // 地图点击事件
        this.map.addEventListener('click', (e) => {
            if (this.pickingCallback) {
                this.pickingCallback(e.point.lat, e.point.lng);
                this.pickingCallback = null;
                this.map.setDefaultCursor('default');
            }
        });

        console.log('地图初始化成功');
        return true;
    }

    /**
     * 启用地图选点模式
     */
    enableLocationPicker(callback) {
        this.pickingCallback = callback;
        this.map.setDefaultCursor('crosshair');
        
        // 30秒后自动取消选点模式
        setTimeout(() => {
            if (this.pickingCallback === callback) {
                this.cancelLocationPicker();
            }
        }, 30000);
    }

    /**
     * 取消地图选点模式
     */
    cancelLocationPicker() {
        this.pickingCallback = null;
        this.map.setDefaultCursor('default');
    }

    /**
     * 添加人员标记
     */
    addPersonMarker(personId, lat, lng, name, color) {
        // 移除旧标记
        this.removePersonMarker(personId);

        const point = new BMap.Point(lng, lat);
        
        // 创建更美观的自定义图标
        const markerColor = color || '#667eea';
        const icon = new BMap.Icon(
            'data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
                    <defs>
                        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${markerColor}" flood-opacity="0.5"/>
                        </filter>
                    </defs>
                    <path d="M18 2C9.2 2 2 9.2 2 18c0 12 16 26 16 26s16-14 16-26c0-8.8-7.2-16-16-16z" 
                          fill="${markerColor}" filter="url(#shadow)"/>
                    <circle cx="18" cy="18" r="7" fill="white"/>
                    <circle cx="18" cy="18" r="4" fill="${markerColor}"/>
                </svg>
            `),
            new BMap.Size(36, 46)
        );
        icon.setAnchor(new BMap.Size(18, 46));
        
        const marker = new BMap.Marker(point, { icon: icon });
        
        // 创建自定义标签
        const label = new BMap.Label(name || `用户${personId}`, {
            offset: new BMap.Size(20, -20)
        });
        label.setStyle({
            background: 'rgba(26, 26, 46, 0.9)',
            color: '#fff',
            border: `2px solid ${markerColor}`,
            borderRadius: '20px',
            padding: '4px 12px',
            fontSize: '12px',
            fontWeight: '500',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap'
        });
        marker.setLabel(label);

        // 添加信息窗口
        marker.addEventListener('click', () => {
            const infoWindow = new BMap.InfoWindow(
                `<div style="padding: 5px;">
                    <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px;">${name || '用户' + personId}</div>
                    <div style="font-size: 12px; color: #666;">
                        <div>经度: ${lng.toFixed(6)}</div>
                        <div>纬度: ${lat.toFixed(6)}</div>
                    </div>
                </div>`,
                { width: 180, height: 80 }
            );
            this.map.openInfoWindow(infoWindow, point);
        });

        this.map.addOverlay(marker);
        this.personMarkers[personId] = marker;
    }

    /**
     * 移除人员标记
     */
    removePersonMarker(personId) {
        if (this.personMarkers[personId]) {
            this.map.removeOverlay(this.personMarkers[personId]);
            delete this.personMarkers[personId];
        }
    }

    /**
     * 添加会面点标记
     */
    addMeetingMarker(lat, lng, rank, name, address) {
        const point = new BMap.Point(lng, lat);
        
        // 创建渐变色的会面点图标
        const icon = new BMap.Icon(
            'data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
                    <defs>
                        <linearGradient id="grad${rank}" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#11998e"/>
                            <stop offset="100%" style="stop-color:#38ef7d"/>
                        </linearGradient>
                        <filter id="glow${rank}" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#38ef7d" flood-opacity="0.6"/>
                        </filter>
                    </defs>
                    <path d="M20 2C9.5 2 1 10.5 1 21c0 14 19 28 19 28s19-14 19-28C39 10.5 30.5 2 20 2z" 
                          fill="url(#grad${rank})" filter="url(#glow${rank})"/>
                    <circle cx="20" cy="20" r="12" fill="white"/>
                    <text x="20" y="25" text-anchor="middle" fill="#11998e" font-size="14" font-weight="bold">${rank}</text>
                </svg>
            `),
            new BMap.Size(40, 50)
        );
        icon.setAnchor(new BMap.Size(20, 50));
        
        const marker = new BMap.Marker(point, { icon: icon });

        // 添加信息窗口
        marker.addEventListener('click', () => {
            const infoWindow = new BMap.InfoWindow(
                `<div style="padding: 5px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <span style="background: linear-gradient(135deg, #11998e, #38ef7d); color: white; 
                                     width: 24px; height: 24px; border-radius: 6px; display: flex; 
                                     align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">${rank}</span>
                        <span style="font-weight: 600; font-size: 14px;">${name}</span>
                    </div>
                    <div style="font-size: 12px; color: #666;">${address}</div>
                </div>`,
                { width: 220, height: 90 }
            );
            this.map.openInfoWindow(infoWindow, point);
        });

        this.map.addOverlay(marker);
        this.meetingMarkers.push(marker);
    }

    /**
     * 添加中心点标记
     */
    addCenterMarker(lat, lng) {
        if (this.centerMarker) {
            this.map.removeOverlay(this.centerMarker);
        }

        const point = new BMap.Point(lng, lat);
        
        // 创建发光的中心点图标
        const icon = new BMap.Icon(
            'data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
                    <defs>
                        <filter id="centerGlow" x="-100%" y="-100%" width="300%" height="300%">
                            <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#f59e0b" flood-opacity="0.8"/>
                        </filter>
                    </defs>
                    <circle cx="15" cy="15" r="12" fill="#f59e0b" filter="url(#centerGlow)"/>
                    <circle cx="15" cy="15" r="8" fill="white"/>
                    <circle cx="15" cy="15" r="4" fill="#f59e0b"/>
                </svg>
            `),
            new BMap.Size(30, 30)
        );
        icon.setAnchor(new BMap.Size(15, 15));
        
        this.centerMarker = new BMap.Marker(point, { icon: icon });
        
        const label = new BMap.Label('几何中心', {
            offset: new BMap.Size(18, -8)
        });
        label.setStyle({
            background: 'rgba(245, 158, 11, 0.9)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '3px 10px',
            fontSize: '11px',
            fontWeight: '500',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
        });
        this.centerMarker.setLabel(label);

        this.map.addOverlay(this.centerMarker);
    }

    /**
     * 清除所有会面点标记
     */
    clearMeetingMarkers() {
        this.meetingMarkers.forEach(marker => {
            this.map.removeOverlay(marker);
        });
        this.meetingMarkers = [];

        if (this.centerMarker) {
            this.map.removeOverlay(this.centerMarker);
            this.centerMarker = null;
        }
    }

    /**
     * 绘制路线
     */
    drawRoute(path, color, personName) {
        if (!path || path.length < 2) return;

        const points = path.map(p => new BMap.Point(p.lng, p.lat));
        
        // 绘制发光效果的底层线
        const glowLine = new BMap.Polyline(points, {
            strokeColor: color,
            strokeWeight: 8,
            strokeOpacity: 0.3
        });
        this.map.addOverlay(glowLine);
        this.routeOverlays.push(glowLine);
        
        // 绘制主线
        const polyline = new BMap.Polyline(points, {
            strokeColor: color,
            strokeWeight: 4,
            strokeOpacity: 0.9
        });

        this.map.addOverlay(polyline);
        this.routeOverlays.push(polyline);
    }

    /**
     * 清除所有路线
     */
    clearRoutes() {
        this.routeOverlays.forEach(overlay => {
            this.map.removeOverlay(overlay);
        });
        this.routeOverlays = [];
    }

    /**
     * 清除所有覆盖物
     */
    clearAll() {
        this.map.clearOverlays();
        this.personMarkers = {};
        this.meetingMarkers = [];
        this.centerMarker = null;
        this.routeOverlays = [];
    }

    /**
     * 调整地图视野包含所有标记
     */
    fitViewToAllMarkers() {
        const points = [];

        // 收集所有人员位置
        Object.values(this.personMarkers).forEach(marker => {
            points.push(marker.getPosition());
        });

        // 收集所有会面点位置
        this.meetingMarkers.forEach(marker => {
            points.push(marker.getPosition());
        });

        // 收集中心点
        if (this.centerMarker) {
            points.push(this.centerMarker.getPosition());
        }

        if (points.length > 0) {
            this.map.setViewport(points, { margins: [50, 50, 50, 50] });
        }
    }

    /**
     * 聚焦到指定位置
     */
    focusOn(lat, lng, zoom = 15) {
        const point = new BMap.Point(lng, lat);
        this.map.centerAndZoom(point, zoom);
    }

    /**
     * 获取颜色
     */
    getColor(index) {
        return this.colors[index % this.colors.length];
    }
}

// 创建全局实例
const mapHandler = new MapHandler();
