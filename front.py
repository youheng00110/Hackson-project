#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
百度地图导航系统前端 - Navigation System Frontend with Baidu Map

这是一个使用 Flask 框架的单文件 Web 应用，提供基于百度地图的导航系统前端界面。

功能特性：
- ✅ 显示百度地图
- ✅ POI 地点搜索
- ✅ 起点/终点输入与路线规划（驾车/步行）
- ✅ 基本的页面UI（输入框、按钮、结果面板）

安装依赖：
    pip install flask

运行方式：
    方式1 - 使用环境变量（推荐）：
    BAIDU_MAP_AK=your_api_key_here python front.py
    
    方式2 - 在代码中设置（第29行）：
    BAIDU_MAP_AK = "your_api_key_here"  # 不推荐，仅用于测试
    python front.py

访问地址：
    http://localhost:5000

注意事项：
1. 百度地图 API Key (AK) 可在百度地图开放平台申请：https://lbsyun.baidu.com/
2. 需要使用"浏览器端"类型的 AK
3. 如果 AK 未配置，页面会显示清晰的错误提示，不会崩溃
"""

import os
from flask import Flask, render_template_string

app = Flask(__name__)

# 从环境变量获取百度地图 API Key
# 如需测试，可以临时在这里设置：BAIDU_MAP_AK = "your_api_key_here"
BAIDU_MAP_AK = os.environ.get('BAIDU_MAP_AK', '')

# HTML 模板（内嵌 CSS 和 JavaScript）
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>百度地图导航系统 - Navigation System</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            height: 100vh;
            display: flex;
            flex-direction: column;
            background-color: #f5f5f5;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-size: 24px;
            margin-bottom: 5px;
        }
        
        .header p {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .main-container {
            display: flex;
            flex: 1;
            overflow: hidden;
        }
        
        .map-container {
            flex: 1;
            position: relative;
        }
        
        #map {
            width: 100%;
            height: 100%;
        }
        
        .control-panel {
            width: 380px;
            background: white;
            padding: 20px;
            overflow-y: auto;
            box-shadow: -2px 0 8px rgba(0,0,0,0.1);
        }
        
        .section {
            margin-bottom: 25px;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #333;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #667eea;
        }
        
        .input-group {
            margin-bottom: 15px;
        }
        
        .input-group label {
            display: block;
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
            font-weight: 500;
        }
        
        .input-group input,
        .input-group select {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        
        .input-group input:focus,
        .input-group select:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .button-group {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        
        .btn {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .btn-secondary {
            background: #f0f0f0;
            color: #666;
        }
        
        .btn-secondary:hover {
            background: #e0e0e0;
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none !important;
        }
        
        .result-panel {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #667eea;
            font-size: 14px;
            line-height: 1.6;
            max-height: 200px;
            overflow-y: auto;
            color: #333;
        }
        
        .result-panel.empty {
            color: #999;
            text-align: center;
        }
        
        .error-message {
            background: #fff3cd;
            border-left-color: #ffc107;
            color: #856404;
        }
        
        .success-message {
            background: #d4edda;
            border-left-color: #28a745;
            color: #155724;
        }
        
        .poi-item {
            padding: 10px;
            margin: 5px 0;
            background: white;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .poi-item:hover {
            background: #f0f0f0;
            transform: translateX(5px);
        }
        
        .poi-title {
            font-weight: 600;
            color: #333;
            margin-bottom: 3px;
        }
        
        .poi-address {
            font-size: 12px;
            color: #666;
        }
        
        .loading {
            text-align: center;
            padding: 20px;
            color: #999;
        }
        
        .loading::after {
            content: '...';
            animation: dots 1.5s steps(4, end) infinite;
        }
        
        @keyframes dots {
            0%, 20% { content: '.'; }
            40% { content: '..'; }
            60%, 100% { content: '...'; }
        }
        
        /* API Key 错误提示样式 */
        .api-error-container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .api-error-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        
        .api-error-title {
            font-size: 28px;
            margin-bottom: 15px;
        }
        
        .api-error-message {
            font-size: 16px;
            line-height: 1.6;
            max-width: 600px;
            margin-bottom: 30px;
        }
        
        .api-error-code {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px 20px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            margin: 10px 0;
        }
        
        .api-error-steps {
            text-align: left;
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 8px;
            max-width: 600px;
            margin-top: 20px;
        }
        
        .api-error-steps ol {
            margin-left: 20px;
            line-height: 1.8;
        }
    </style>
    {% if ak %}
    <script type="text/javascript" src="https://api.map.baidu.com/api?v=3.0&ak={{ ak }}"></script>
    {% endif %}
</head>
<body>
    <div class="header">
        <h1>🗺️ 百度地图导航系统</h1>
        <p>Navigation System with Baidu Map - POI Search & Route Planning</p>
    </div>
    
    {% if not ak %}
    <!-- API Key 未配置的错误提示 -->
    <div class="api-error-container">
        <div class="api-error-icon">⚠️</div>
        <div class="api-error-title">百度地图 API Key 未配置</div>
        <div class="api-error-message">
            系统检测到 BAIDU_MAP_AK 环境变量未设置。<br>
            请按照以下步骤配置您的百度地图 API Key：
        </div>
        <div class="api-error-steps">
            <ol>
                <li>访问 <a href="https://lbsyun.baidu.com/" target="_blank" style="color: #fff; text-decoration: underline;">百度地图开放平台</a></li>
                <li>注册账号并创建应用（选择"浏览器端"类型）</li>
                <li>获取您的 API Key (AK)</li>
                <li>设置环境变量并重新启动应用：</li>
            </ol>
        </div>
        <div class="api-error-code">
            # Linux/Mac:<br>
            export BAIDU_MAP_AK=your_api_key_here<br>
            python front.py<br>
            <br>
            # Windows (cmd):<br>
            set BAIDU_MAP_AK=your_api_key_here<br>
            python front.py<br>
            <br>
            # Windows (PowerShell):<br>
            $env:BAIDU_MAP_AK="your_api_key_here"<br>
            python front.py<br>
            <br>
            # 或者直接运行：<br>
            BAIDU_MAP_AK=your_api_key_here python front.py
        </div>
    </div>
    {% else %}
    <!-- 正常的地图界面 -->
    <div class="main-container">
        <div class="map-container">
            <div id="map"></div>
        </div>
        
        <div class="control-panel">
            <!-- POI 搜索 -->
            <div class="section">
                <div class="section-title">🔍 POI 地点搜索</div>
                <div class="input-group">
                    <label>搜索关键词</label>
                    <input type="text" id="poiKeyword" placeholder="例如：美食、学校、医院..." value="咖啡厅">
                </div>
                <div class="input-group">
                    <label>搜索城市</label>
                    <input type="text" id="poiCity" placeholder="例如：北京" value="北京">
                </div>
                <div class="button-group">
                    <button class="btn btn-primary" onclick="searchPOI()">搜索</button>
                    <button class="btn btn-secondary" onclick="clearPOI()">清除结果</button>
                </div>
                <div id="poiResult" class="result-panel empty" style="margin-top: 15px;">
                    在这里搜索感兴趣的地点
                </div>
            </div>
            
            <!-- 路线规划 -->
            <div class="section">
                <div class="section-title">🚗 路线规划</div>
                <div class="input-group">
                    <label>起点</label>
                    <input type="text" id="startPoint" placeholder="例如：北京天安门" value="北京天安门">
                </div>
                <div class="input-group">
                    <label>终点</label>
                    <input type="text" id="endPoint" placeholder="例如：北京西站" value="北京西站">
                </div>
                <div class="input-group">
                    <label>出行方式</label>
                    <select id="travelMode">
                        <option value="driving">🚗 驾车（最短时间）</option>
                        <option value="walking">🚶 步行</option>
                        <option value="transit">🚌 公交</option>
                        <option value="riding">🚴 骑行</option>
                    </select>
                </div>
                <div class="button-group">
                    <button class="btn btn-primary" onclick="planRoute()">规划路线</button>
                    <button class="btn btn-secondary" onclick="clearRoute()">清除路线</button>
                </div>
                <div id="routeResult" class="result-panel empty" style="margin-top: 15px;">
                    规划结果将显示在这里
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // 检查百度地图 API 是否加载成功
        if (typeof BMap === 'undefined') {
            alert('百度地图 API 加载失败！请检查网络连接或 API Key 配置。');
            console.error('BMap is undefined - API failed to load');
        }
        
        // 初始化地图
        var map = new BMap.Map("map");
        var point = new BMap.Point(116.404, 39.915); // 北京市中心
        map.centerAndZoom(point, 12);
        map.enableScrollWheelZoom(true);
        
        // 添加地图控件
        map.addControl(new BMap.NavigationControl());
        map.addControl(new BMap.ScaleControl());
        map.addControl(new BMap.OverviewMapControl());
        
        // 存储覆盖物
        var overlays = [];
        var poiMarkers = [];
        
        // POI 搜索功能
        function searchPOI() {
            var keyword = document.getElementById('poiKeyword').value.trim();
            var city = document.getElementById('poiCity').value.trim();
            
            if (!keyword) {
                showResult('poiResult', '请输入搜索关键词', 'error');
                return;
            }
            
            showResult('poiResult', '<div class="loading">搜索中</div>', '');
            
            // 清除之前的POI标记
            clearPOI();
            
            var local = new BMap.LocalSearch(map, {
                onSearchComplete: function(results) {
                    if (local.getStatus() == BMAP_STATUS_SUCCESS) {
                        var resultHtml = '<div style="font-weight: 600; margin-bottom: 10px;">找到 ' + results.getCurrentNumPois() + ' 个结果：</div>';
                        
                        for (var i = 0; i < results.getCurrentNumPois(); i++) {
                            var poi = results.getPoi(i);
                            var marker = new BMap.Marker(poi.point);
                            map.addOverlay(marker);
                            poiMarkers.push(marker);
                            
                            // 添加点击事件
                            (function(p, title, addr) {
                                marker.addEventListener("click", function() {
                                    var infoWindow = new BMap.InfoWindow(
                                        '<div style="padding: 5px;"><strong>' + title + '</strong><br>' + 
                                        '<span style="color: #666;">' + addr + '</span></div>'
                                    );
                                    map.openInfoWindow(infoWindow, p);
                                });
                            })(poi.point, poi.title, poi.address);
                            
                            // 在结果面板中显示
                            resultHtml += '<div class="poi-item" onclick="jumpToPOI(' + poi.point.lng + ',' + poi.point.lat + ',\'' + poi.title.replace(/'/g, "\\'") + '\')">' +
                                '<div class="poi-title">' + (i + 1) + '. ' + poi.title + '</div>' +
                                '<div class="poi-address">' + poi.address + '</div>' +
                                '</div>';
                        }
                        
                        showResult('poiResult', resultHtml, 'success');
                        
                        // 调整地图视野以显示所有POI
                        if (results.getCurrentNumPois() > 0) {
                            var poi = results.getPoi(0);
                            map.centerAndZoom(poi.point, 15);
                        }
                    } else {
                        showResult('poiResult', '未找到相关地点，请尝试其他关键词', 'error');
                    }
                }
            });
            
            local.search(keyword, city || '全国');
        }
        
        // 跳转到指定POI
        function jumpToPOI(lng, lat, title) {
            var point = new BMap.Point(lng, lat);
            map.centerAndZoom(point, 16);
            map.addOverlay(new BMap.Marker(point));
        }
        
        // 清除POI搜索结果
        function clearPOI() {
            poiMarkers.forEach(function(marker) {
                map.removeOverlay(marker);
            });
            poiMarkers = [];
            document.getElementById('poiResult').innerHTML = '在这里搜索感兴趣的地点';
            document.getElementById('poiResult').className = 'result-panel empty';
        }
        
        // 路线规划功能
        function planRoute() {
            var start = document.getElementById('startPoint').value.trim();
            var end = document.getElementById('endPoint').value.trim();
            var mode = document.getElementById('travelMode').value;
            
            if (!start || !end) {
                showResult('routeResult', '请输入起点和终点', 'error');
                return;
            }
            
            showResult('routeResult', '<div class="loading">规划中</div>', '');
            
            // 清除之前的路线
            clearRoute();
            
            // 地理编码
            var geocoder = new BMap.Geocoder();
            
            geocoder.getPoint(start, function(startPt) {
                if (startPt) {
                    geocoder.getPoint(end, function(endPt) {
                        if (endPt) {
                            // 根据出行方式调用不同的路线规划API
                            switch(mode) {
                                case 'driving':
                                    planDrivingRoute(startPt, endPt);
                                    break;
                                case 'walking':
                                    planWalkingRoute(startPt, endPt);
                                    break;
                                case 'transit':
                                    planTransitRoute(startPt, endPt);
                                    break;
                                case 'riding':
                                    planRidingRoute(startPt, endPt);
                                    break;
                            }
                        } else {
                            showResult('routeResult', '终点地址解析失败，请检查地址是否正确', 'error');
                        }
                    });
                } else {
                    showResult('routeResult', '起点地址解析失败，请检查地址是否正确', 'error');
                }
            });
        }
        
        // 驾车路线规划
        function planDrivingRoute(start, end) {
            var driving = new BMap.DrivingRoute(map, {
                onSearchComplete: function(results) {
                    if (driving.getStatus() == BMAP_STATUS_SUCCESS) {
                        var plan = results.getPlan(0);
                        var route = plan.getRoute(0);
                        var pts = route.getPath();
                        
                        var polyline = new BMap.Polyline(pts, {
                            strokeColor: "#1890ff",
                            strokeWeight: 5,
                            strokeOpacity: 0.8
                        });
                        map.addOverlay(polyline);
                        overlays.push(polyline);
                        
                        addStartEndMarkers(start, end, '🚗');
                        map.setViewport([start, end]);
                        
                        var resultHtml = '<div style="font-weight: 600; color: #1890ff; margin-bottom: 10px;">🚗 驾车路线</div>' +
                            '<div>📏 距离：<strong>' + plan.getDistance(true) + '</strong></div>' +
                            '<div>⏱️ 时间：<strong>' + plan.getDuration(true) + '</strong></div>' +
                            '<div style="margin-top: 8px; color: #666;">已在地图上显示路线</div>';
                        showResult('routeResult', resultHtml, 'success');
                    } else {
                        showResult('routeResult', '驾车路线规划失败', 'error');
                    }
                }
            });
            driving.search(start, end);
        }
        
        // 步行路线规划
        function planWalkingRoute(start, end) {
            var walking = new BMap.WalkingRoute(map, {
                onSearchComplete: function(results) {
                    if (walking.getStatus() == BMAP_STATUS_SUCCESS) {
                        var plan = results.getPlan(0);
                        var route = plan.getRoute(0);
                        var pts = route.getPath();
                        
                        var polyline = new BMap.Polyline(pts, {
                            strokeColor: "#52c41a",
                            strokeWeight: 4,
                            strokeOpacity: 0.8
                        });
                        map.addOverlay(polyline);
                        overlays.push(polyline);
                        
                        addStartEndMarkers(start, end, '🚶');
                        map.setViewport([start, end]);
                        
                        var resultHtml = '<div style="font-weight: 600; color: #52c41a; margin-bottom: 10px;">🚶 步行路线</div>' +
                            '<div>📏 距离：<strong>' + plan.getDistance(true) + '</strong></div>' +
                            '<div>⏱️ 时间：<strong>' + plan.getDuration(true) + '</strong></div>' +
                            '<div style="margin-top: 8px; color: #666;">已在地图上显示路线</div>';
                        showResult('routeResult', resultHtml, 'success');
                    } else {
                        showResult('routeResult', '步行路线规划失败', 'error');
                    }
                }
            });
            walking.search(start, end);
        }
        
        // 公交路线规划
        function planTransitRoute(start, end) {
            var transit = new BMap.TransitRoute(map, {
                onSearchComplete: function(results) {
                    if (transit.getStatus() == BMAP_STATUS_SUCCESS) {
                        var plan = results.getPlan(0);
                        
                        addStartEndMarkers(start, end, '🚌');
                        map.setViewport([start, end]);
                        
                        var resultHtml = '<div style="font-weight: 600; color: #fa8c16; margin-bottom: 10px;">🚌 公交路线</div>' +
                            '<div>📏 距离：<strong>' + plan.getDistance(true) + '</strong></div>' +
                            '<div>⏱️ 时间：<strong>' + plan.getDuration(true) + '</strong></div>' +
                            '<div style="margin-top: 8px; color: #666;">' + plan.getDescription(true) + '</div>';
                        showResult('routeResult', resultHtml, 'success');
                    } else {
                        showResult('routeResult', '公交路线规划失败', 'error');
                    }
                }
            });
            transit.search(start, end);
        }
        
        // 骑行路线规划
        function planRidingRoute(start, end) {
            var riding = new BMap.RidingRoute(map, {
                onSearchComplete: function(results) {
                    if (riding.getStatus() == BMAP_STATUS_SUCCESS) {
                        var plan = results.getPlan(0);
                        var route = plan.getRoute(0);
                        var pts = route.getPath();
                        
                        var polyline = new BMap.Polyline(pts, {
                            strokeColor: "#fa541c",
                            strokeWeight: 4,
                            strokeOpacity: 0.8
                        });
                        map.addOverlay(polyline);
                        overlays.push(polyline);
                        
                        addStartEndMarkers(start, end, '🚴');
                        map.setViewport([start, end]);
                        
                        var resultHtml = '<div style="font-weight: 600; color: #fa541c; margin-bottom: 10px;">🚴 骑行路线</div>' +
                            '<div>📏 距离：<strong>' + plan.getDistance(true) + '</strong></div>' +
                            '<div>⏱️ 时间：<strong>' + plan.getDuration(true) + '</strong></div>' +
                            '<div style="margin-top: 8px; color: #666;">已在地图上显示路线</div>';
                        showResult('routeResult', resultHtml, 'success');
                    } else {
                        showResult('routeResult', '骑行路线规划失败', 'error');
                    }
                }
            });
            riding.search(start, end);
        }
        
        // 添加起点和终点标记
        function addStartEndMarkers(start, end, emoji) {
            var startMarker = new BMap.Marker(start);
            var endMarker = new BMap.Marker(end);
            
            var startLabel = new BMap.Label(emoji + " 起点", {offset: new BMap.Size(15, -10)});
            var endLabel = new BMap.Label(emoji + " 终点", {offset: new BMap.Size(15, -10)});
            
            startLabel.setStyle({
                color: "white",
                backgroundColor: "#52c41a",
                border: "none",
                padding: "5px 10px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "bold"
            });
            
            endLabel.setStyle({
                color: "white",
                backgroundColor: "#f5222d",
                border: "none",
                padding: "5px 10px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "bold"
            });
            
            startMarker.setLabel(startLabel);
            endMarker.setLabel(endLabel);
            
            map.addOverlay(startMarker);
            map.addOverlay(endMarker);
            
            overlays.push(startMarker);
            overlays.push(endMarker);
        }
        
        // 清除路线
        function clearRoute() {
            overlays.forEach(function(overlay) {
                map.removeOverlay(overlay);
            });
            overlays = [];
            document.getElementById('routeResult').innerHTML = '规划结果将显示在这里';
            document.getElementById('routeResult').className = 'result-panel empty';
        }
        
        // 显示结果的辅助函数
        function showResult(elementId, message, type) {
            var element = document.getElementById(elementId);
            element.innerHTML = message;
            element.className = 'result-panel';
            if (type === 'error') {
                element.className += ' error-message';
            } else if (type === 'success') {
                element.className += ' success-message';
            }
        }
        
        // 地图加载完成提示
        map.addEventListener("tilesloaded", function() {
            console.log("✓ 百度地图加载成功！");
        });
    </script>
    {% endif %}
</body>
</html>
"""

@app.route('/')
def index():
    """主页路由"""
    return render_template_string(HTML_TEMPLATE, ak=BAIDU_MAP_AK)

@app.route('/health')
def health():
    """健康检查接口"""
    return {
        'status': 'ok',
        'ak_configured': bool(BAIDU_MAP_AK)
    }

if __name__ == '__main__':
    # 启动提示
    print("=" * 60)
    print("🗺️  百度地图导航系统前端")
    print("=" * 60)
    
    if not BAIDU_MAP_AK:
        print("⚠️  警告：BAIDU_MAP_AK 环境变量未设置")
        print("   应用将正常启动，但地图功能需要配置 API Key")
        print("   请访问 http://localhost:5000 查看详细配置说明")
    else:
        print(f"✓ BAIDU_MAP_AK 已配置：{BAIDU_MAP_AK[:10]}...")
        print("✓ 应用启动成功")
    
    print("\n访问地址：http://localhost:5000")
    print("健康检查：http://localhost:5000/health")
    print("\n按 Ctrl+C 停止服务")
    print("=" * 60)
    
    # 启动 Flask 应用
    app.run(host='0.0.0.0', port=5000, debug=False)