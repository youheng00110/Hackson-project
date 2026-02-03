/**
 * 地图容器组件
 */

import { useEffect, useRef, useCallback } from 'react';
import amapService from '../../services/amapService';
import './MapContainer.css';

// 不同出行方式的颜色
const TRANSPORT_COLORS = {
    walking: '#52c41a',
    bicycling: '#1890ff',
    transit: '#722ed1',
    driving: '#fa541c'
};

function MapContainer({ persons, meetingPoints, selectedPoint, onMapClick }) {
    const mapContainerRef = useRef(null);
    const mapInitialized = useRef(false);

    // 初始化地图
    useEffect(() => {
        if (!mapContainerRef.current || mapInitialized.current) return;

        const initMap = async () => {
            try {
                await amapService.initMap('map-container');
                mapInitialized.current = true;

                // 百度地图点击事件
                const map = amapService.getMap();
                if (map && onMapClick) {
                    map.addEventListener('click', (e) => {
                        onMapClick({
                            lng: e.point.lng,
                            lat: e.point.lat
                        });
                    });
                }
            } catch (error) {
                console.error('地图初始化失败:', error);
            }
        };

        initMap();
    }, [onMapClick]);

    // 绘制人员标记
    const drawPersonMarkers = useCallback(() => {
        persons.forEach((person, index) => {
            const color = TRANSPORT_COLORS[person.transportMode] || '#1890ff';

            const content = `
        <div class="person-marker" style="background-color: ${color}">
          <span class="marker-label">${person.name || '用户' + (index + 1)}</span>
        </div>
      `;

            amapService.addCustomMarker({
                position: [person.lng, person.lat],
                content: content
            });
        });
    }, [persons]);

    // 绘制会面点标记
    const drawMeetingPointMarkers = useCallback(() => {
        meetingPoints.forEach((point, index) => {
            const isSelected = selectedPoint && selectedPoint.id === point.id;
            const content = `
        <div class="meeting-marker ${isSelected ? 'selected' : ''}">
          <span class="marker-rank">#${index + 1}</span>
          <span class="marker-name">${point.name || '推荐地点'}</span>
        </div>
      `;

            amapService.addCustomMarker({
                position: [point.lng, point.lat],
                content: content
            });
        });
    }, [meetingPoints, selectedPoint]);

    // 绘制路线
    const drawRoutes = useCallback(() => {
        if (!selectedPoint || !selectedPoint.routeInfos) return;

        selectedPoint.routeInfos.forEach((routeInfo) => {
            if (routeInfo.polyline && routeInfo.polyline.length > 0) {
                const color = TRANSPORT_COLORS[routeInfo.transportMode] || '#1890ff';
                amapService.drawPolyline({
                    path: routeInfo.polyline,
                    strokeColor: color,
                    strokeWeight: 4
                });
            }
        });
    }, [selectedPoint]);

    // 更新地图显示
    useEffect(() => {
        if (!mapInitialized.current) return;

        // 清除之前的覆盖物
        amapService.clearAll();

        // 绘制人员标记
        if (persons.length > 0) {
            drawPersonMarkers();
        }

        // 绘制会面点
        if (meetingPoints.length > 0) {
            drawMeetingPointMarkers();
        }

        // 绘制路线
        if (selectedPoint) {
            drawRoutes();
        }

        // 自适应视野
        if (persons.length > 0 || meetingPoints.length > 0) {
            setTimeout(() => {
                amapService.setFitView();
            }, 100);
        }
    }, [persons, meetingPoints, selectedPoint, drawPersonMarkers, drawMeetingPointMarkers, drawRoutes]);

    return (
        <div className="map-wrapper">
            <div id="map-container" ref={mapContainerRef} className="map-container" />

            {/* 图例 */}
            <div className="map-legend">
                <div className="legend-title">图例</div>
                <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: TRANSPORT_COLORS.walking }}></span>
                    <span>步行</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: TRANSPORT_COLORS.bicycling }}></span>
                    <span>骑行</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: TRANSPORT_COLORS.transit }}></span>
                    <span>公交</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: TRANSPORT_COLORS.driving }}></span>
                    <span>驾车</span>
                </div>
            </div>
        </div>
    );
}

export default MapContainer;
