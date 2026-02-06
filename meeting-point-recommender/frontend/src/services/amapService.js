/**
 * 百度地图服务封装
 */

class BmapService {
    constructor() {
        this.map = null;
        this.BMap = null;
        this.markers = [];
        this.polylines = [];
        this.infoWindow = null;
        this.isLoaded = false;
        this.loadingPromise = null; // 防止重复加载
    }

    /**
     * 加载百度地图 SDK
     */
    loadScript() {
        // 如果已经加载完成，直接返回
        if (window.BMap) {
            this.BMap = window.BMap;
            this.isLoaded = true;
            return Promise.resolve(window.BMap);
        }

        // 如果正在加载中，返回同一个Promise，并确保完成后设置BMap
        if (this.loadingPromise) {
            return this.loadingPromise.then(() => {
                this.BMap = window.BMap;
                this.isLoaded = true;
                return window.BMap;
            });
        }

        // 开始加载
        this.loadingPromise = new Promise((resolve, reject) => {
            const ak = import.meta.env.VITE_BMAP_WEB_KEY;
            const callbackName = 'initBMap_' + Date.now();

            window[callbackName] = () => {
                this.BMap = window.BMap;
                this.isLoaded = true;
                delete window[callbackName];
                resolve(window.BMap);
            };

            const script = document.createElement('script');
            script.src = `https://api.map.baidu.com/api?v=3.0&ak=${ak}&callback=${callbackName}`;
            script.onerror = () => {
                delete window[callbackName];
                this.loadingPromise = null;
                reject(new Error('百度地图加载失败'));
            };
            document.head.appendChild(script);
        });

        return this.loadingPromise;
    }

    /**
     * 初始化地图
     */
    async initMap(containerId, options = {}) {
        try {
            await this.loadScript();

            this.map = new this.BMap.Map(containerId);

            const center = options.center || [116.397428, 39.90923];
            const point = new this.BMap.Point(center[0], center[1]);
            this.map.centerAndZoom(point, options.zoom || 12);

            // 启用滚轮缩放
            this.map.enableScrollWheelZoom(true);

            // 添加控件
            this.map.addControl(new this.BMap.NavigationControl());
            this.map.addControl(new this.BMap.ScaleControl());

            // 初始化信息窗口
            this.infoWindow = new this.BMap.InfoWindow('', {
                width: 200,
                height: 100,
                offset: new this.BMap.Size(0, -20)
            });

            return this.map;
        } catch (error) {
            console.error('地图初始化失败:', error);
            throw error;
        }
    }

    /**
     * 获取地图实例
     */
    getMap() {
        return this.map;
    }

    /**
     * 获取 BMap 对象
     */
    getBMap() {
        return this.BMap;
    }

    /**
     * 添加自定义内容标记
     */
    addCustomMarker(options) {
        const { position, content, onClick } = options;

        const point = new this.BMap.Point(position[0], position[1]);

        // 使用自定义 HTML 覆盖物
        const label = new this.BMap.Label(content, {
            position: point,
            offset: new this.BMap.Size(-40, -20)
        });

        label.setStyle({
            border: 'none',
            background: 'transparent',
            padding: '0'
        });

        if (onClick) {
            label.addEventListener('click', onClick);
        }

        this.map.addOverlay(label);
        this.markers.push(label);
        return label;
    }

    /**
     * 添加普通标记
     */
    addMarker(options) {
        const { position, title, onClick } = options;

        const point = new this.BMap.Point(position[0], position[1]);
        const marker = new this.BMap.Marker(point);

        if (title) {
            marker.setTitle(title);
        }

        if (onClick) {
            marker.addEventListener('click', onClick);
        }

        this.map.addOverlay(marker);
        this.markers.push(marker);
        return marker;
    }

    /**
     * 绘制路线
     */
    drawPolyline(options) {
        const { path, strokeColor = '#3366FF', strokeWeight = 5, strokeOpacity = 0.8 } = options;

        if (!path || path.length === 0) return null;

        const points = path.map(p => new this.BMap.Point(p[0], p[1]));

        const polyline = new this.BMap.Polyline(points, {
            strokeColor: strokeColor,
            strokeWeight: strokeWeight,
            strokeOpacity: strokeOpacity
        });

        this.map.addOverlay(polyline);
        this.polylines.push(polyline);
        return polyline;
    }

    /**
     * 显示信息窗口
     */
    showInfoWindow(content, position) {
        const point = new this.BMap.Point(position[0], position[1]);
        this.infoWindow.setContent(content);
        this.map.openInfoWindow(this.infoWindow, point);
    }

    /**
     * 关闭信息窗口
     */
    closeInfoWindow() {
        if (this.map) {
            this.map.closeInfoWindow();
        }
    }

    /**
     * 清除所有标记
     */
    clearMarkers() {
        if (!this.map) return;
        this.markers.forEach(marker => {
            this.map.removeOverlay(marker);
        });
        this.markers = [];
    }

    /**
     * 清除所有路线
     */
    clearPolylines() {
        if (!this.map) return;
        this.polylines.forEach(polyline => {
            this.map.removeOverlay(polyline);
        });
        this.polylines = [];
    }

    /**
     * 清除所有覆盖物
     */
    clearAll() {
        this.clearMarkers();
        this.clearPolylines();
        this.closeInfoWindow();
    }

    /**
     * 自适应视野
     */
    setFitView() {
        if (this.markers.length === 0 && this.polylines.length === 0) return;

        const points = [];

        this.markers.forEach(marker => {
            if (marker.getPosition) {
                points.push(marker.getPosition());
            } else if (marker.getPoint) {
                points.push(marker.getPoint());
            }
        });

        this.polylines.forEach(polyline => {
            const path = polyline.getPath();
            if (path) {
                points.push(...path);
            }
        });

        if (points.length > 0) {
            const viewport = this.map.getViewport(points);
            this.map.centerAndZoom(viewport.center, viewport.zoom);
        }
    }

    /**
     * 获取当前位置
     */
    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            const geolocation = new this.BMap.Geolocation();

            geolocation.getCurrentPosition((r) => {
                if (geolocation.getStatus() === 0) {
                    resolve({
                        lng: r.point.lng,
                        lat: r.point.lat
                    });
                } else {
                    reject(new Error('定位失败'));
                }
            });
        });
    }

    /**
     * 地点搜索自动补全
     */
    async searchPlace(keyword, city = '北京') {
        // 确保BMap已加载
        if (!this.BMap) {
            try {
                await this.loadScript();
            } catch (error) {
                console.error('加载百度地图失败:', error);
                return [];
            }
        }

        return new Promise((resolve) => {
            // 使用地图实例或城市名称
            const searchContext = this.map || city;
            const local = new this.BMap.LocalSearch(searchContext, {
                onSearchComplete: (results) => {
                    if (local.getStatus() === 0 && results) {
                        const places = [];
                        for (let i = 0; i < results.getCurrentNumPois(); i++) {
                            const poi = results.getPoi(i);
                            if (poi && poi.point) {
                                places.push({
                                    id: poi.uid || `poi_${i}`,
                                    name: poi.title,
                                    address: poi.address || '',
                                    lng: poi.point.lng,
                                    lat: poi.point.lat
                                });
                            }
                        }
                        resolve(places);
                    } else {
                        resolve([]);
                    }
                }
            });

            local.search(keyword);
        });
    }

    /**
     * 逆地理编码 - 根据坐标获取地址
     */
    reverseGeocode(lng, lat) {
        return new Promise((resolve, reject) => {
            if (!this.BMap) {
                reject(new Error('百度地图未加载'));
                return;
            }

            const geocoder = new this.BMap.Geocoder();
            const point = new this.BMap.Point(lng, lat);

            geocoder.getLocation(point, (result) => {
                if (result) {
                    resolve({
                        address: result.address || '',
                        surroundingPois: result.surroundingPois || [],
                        addressComponents: result.addressComponents || {}
                    });
                } else {
                    reject(new Error('逆地理编码失败'));
                }
            });
        });
    }

    /**
     * 销毁地图
     */
    destroy() {
        if (this.map) {
            this.clearAll();
            this.map = null;
            this.BMap = null;
        }
    }
}

// 创建单例
const bmapService = new BmapService();

export default bmapService;
