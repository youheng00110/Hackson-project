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
    public_transport: '#722ed1',
    driving: '#fa541c'
};

function MapContainer({ persons, meetingPoints, selectedPoint, onMapClick, onSelectedPointMove, onPersonMove }) {
    const mapContainerRef = useRef(null);
    const mapInitialized = useRef(false);
    const dragMarkerRef = useRef(null);

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
        const map = amapService.getMap();
        const BMap = amapService.getBMap();
        if (!map || !BMap) return;

        persons.forEach((person, index) => {
            const marker = amapService.addMarker({
                position: [person.lng, person.lat],
                title: person.name || `用户${index + 1}`
            });
            if (!marker) return;

            marker.enableDragging();

            const label = new BMap.Label(person.name || `用户${index + 1}`, {
                offset: new BMap.Size(20, -10)
            });
            label.setStyle({
                border: '1px solid #ff8a00',
                background: '#ff8a00',
                color: '#ffffff',
                padding: '2px 6px',
                borderRadius: '8px',
                fontSize: '12px'
            });
            marker.setLabel(label);

            marker.addEventListener('dragend', (e) => {
                if (onPersonMove) {
                    onPersonMove(person.id, {
                        lng: e.point.lng,
                        lat: e.point.lat
                    });
                }
            });
        });
    }, [persons, onPersonMove]);

    // 绘制会面点标记
        const drawMeetingPointMarkers = useCallback(() => {
        meetingPoints.forEach((point, index) => {
                        const isSelected = selectedPoint && selectedPoint.id === point.id;
                        if (isSelected) return;
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

    const drawSelectedPointMarker = useCallback(() => {
        if (!selectedPoint) return;
        const map = amapService.getMap();
        const BMap = amapService.getBMap();
        if (!map || !BMap) return;

        const marker = amapService.addMarker({
            position: [selectedPoint.lng, selectedPoint.lat],
            title: selectedPoint.name || '选中会面点'
        });
        if (!marker) return;

        marker.enableDragging();

        marker.addEventListener('dragend', (e) => {
            if (onSelectedPointMove) {
                onSelectedPointMove({
                    lng: e.point.lng,
                    lat: e.point.lat
                });
            }
        });

        dragMarkerRef.current = marker;
    }, [selectedPoint, onSelectedPointMove]);

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

        // 绘制选中点（可拖拽）
        if (selectedPoint) {
            drawSelectedPointMarker();
        }

        // 自适应视野
        if (persons.length > 0 || meetingPoints.length > 0) {
            setTimeout(() => {
                amapService.setFitView();
            }, 100);
        }
    }, [persons, meetingPoints, selectedPoint, drawPersonMarkers, drawMeetingPointMarkers, drawRoutes, drawSelectedPointMarker]);

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
                    <span className="legend-color" style={{ backgroundColor: TRANSPORT_COLORS.public_transport }}></span>
                    <span>公共交通</span>
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
