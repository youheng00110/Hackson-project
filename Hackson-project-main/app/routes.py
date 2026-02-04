"""
Flask路由定义
提供API端点和页面渲染
"""
from flask import Blueprint, render_template, request, jsonify
from .baidu_map_service import map_service
from .optimizer import optimizer, format_duration, format_distance
from .config import POI_TYPES, TravelMode, BAIDU_BROWSER_AK

main_bp = Blueprint('main', __name__)


@main_bp.route('/')
def index():
    """主页面"""
    return render_template('index.html', 
                           poi_types=POI_TYPES,
                           browser_ak=BAIDU_BROWSER_AK)


@main_bp.route('/api/geocode', methods=['POST'])
def geocode():
    """
    地理编码API
    请求体: {"address": "地址", "city": "城市(可选)"}
    响应: {"status": "success", "location": {"lng": 经度, "lat": 纬度}}
    """
    try:
        data = request.get_json()
        address = data.get('address', '').strip()
        city = data.get('city', '').strip()
        
        if not address:
            return jsonify({
                "status": "error",
                "message": "地址不能为空"
            }), 400
        
        location = map_service.geocode(address, city)
        
        if location:
            return jsonify({
                "status": "success",
                "location": location
            })
        else:
            return jsonify({
                "status": "error",
                "message": "地址解析失败，请输入更详细的地址"
            }), 400
            
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@main_bp.route('/api/reverse_geocode', methods=['POST'])
def reverse_geocode():
    """
    逆地理编码API
    请求体: {"lat": 纬度, "lng": 经度}
    响应: {"status": "success", "address": "地址"}
    """
    try:
        data = request.get_json()
        lat = data.get('lat')
        lng = data.get('lng')
        
        if lat is None or lng is None:
            return jsonify({
                "status": "error",
                "message": "经纬度不能为空"
            }), 400
        
        address = map_service.reverse_geocode(float(lat), float(lng))
        
        if address:
            return jsonify({
                "status": "success",
                "address": address
            })
        else:
            return jsonify({
                "status": "error",
                "message": "无法获取该位置的地址信息"
            }), 400
            
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@main_bp.route('/api/calculate', methods=['POST'])
def calculate_meeting_point():
    """
    计算最优会面点API
    请求体: {
        "persons": [
            {"id": 1, "name": "张三", "lat": 39.9, "lng": 116.4, "travel_mode": "driving"},
            ...
        ],
        "poi_type": "餐厅",
        "meeting_city": "北京市" (可选)
    }
    响应: {
        "status": "success",
        "center": {"lat": 中心纬度, "lng": 中心经度},
        "meeting_points": [推荐会面点列表]
    }
    """
    try:
        data = request.get_json()
        print(f"收到计算请求数据: {data}")  # 调试信息
        persons = data.get('persons', [])
        poi_type = data.get('poi_type', '餐厅')
        meeting_city = data.get('meeting_city', '')  # 获取城市参数
        search_radius = data.get('search_radius', 5000)  # 获取搜索半径，默认5000米
        
        # 验证参数
        if len(persons) < 2:
            return jsonify({
                "status": "error",
                "message": "至少需要2个人"
            }), 400
        
        if len(persons) > 10:
            return jsonify({
                "status": "error",
                "message": "最多支持10个人"
            }), 400
        
        # 验证每个人的数据
        valid_modes = [TravelMode.DRIVING, TravelMode.TRANSIT, 
                       TravelMode.WALKING, TravelMode.RIDING]
        
        for i, person in enumerate(persons):
            if 'lat' not in person or 'lng' not in person:
                return jsonify({
                    "status": "error",
                    "message": f"第{i+1}个人的位置信息不完整"
                }), 400
            
            if person.get('travel_mode') not in valid_modes:
                return jsonify({
                    "status": "error",
                    "message": f"第{i+1}个人的出行方式无效"
                }), 400
            
            # 确保有ID
            if 'id' not in person:
                person['id'] = i + 1
            
            # 确保有名称
            if 'name' not in person:
                person['name'] = f"用户{i+1}"
            
            # 处理出发时间（可选字段）
            if 'departure_time' not in person:
                person['departure_time'] = None
        
        print(f"调用优化器，人数: {len(persons)}, POI类型: {poi_type}, 城市: {meeting_city}")  # 调试信息
        
        # 调用优化器，传递城市参数和搜索半径（如果提供了城市）
        if meeting_city:  # 如果指定了城市
            result = optimizer.find_optimal_meeting_points_with_city(persons, poi_type, meeting_city, search_radius)
        else:  # 否则使用原有方法
            result = optimizer.find_optimal_meeting_points(persons, poi_type, search_radius)
        
        print(f"优化器返回结果: {result}")  # 调试信息
        
        # 格式化结果
        for point in result.get('meeting_points', []):
            # 格式化时间显示
            point['max_duration_text'] = format_duration(point.get('max_duration'))
            point['avg_duration_text'] = format_duration(point.get('avg_duration'))
            # 添加时间同步相关信息
            point['arrival_time_variance_text'] = f"{point.get('arrival_time_variance', 0):.2f}" if point.get('arrival_time_variance') is not None else "N/A"
            point['time_sync_score_text'] = f"{point.get('time_sync_score', 0):.2f}" if point.get('time_sync_score') is not None else "N/A"
            
            # 格式化每个人的路线信息
            for route in point.get('routes', []):
                route['duration_text'] = format_duration(route.get('duration'))
                route['distance_text'] = format_distance(route.get('distance'))
        
        response_data = {
            "status": "success",
            **result
        }
        print(f"返回响应数据: {response_data}")  # 调试信息
        return jsonify(response_data)
        
    except ValueError as e:
        print(f"ValueError: {e}")  # 调试信息
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Exception: {e}")  # 调试信息
        return jsonify({
            "status": "error",
            "message": f"服务器内部错误: {str(e)}"
        }), 500


@main_bp.route('/api/search_poi', methods=['POST'])
def search_poi():
    """
    搜索POI API
    请求体: {"lat": 纬度, "lng": 经度, "type": "POI类型", "radius": 搜索半径}
    响应: {"status": "success", "pois": [POI列表]}
    """
    try:
        data = request.get_json()
        lat = data.get('lat')
        lng = data.get('lng')
        poi_type = data.get('type', '餐厅')
        radius = data.get('radius', 2000)
        
        if lat is None or lng is None:
            return jsonify({
                "status": "error",
                "message": "位置信息不能为空"
            }), 400
        
        pois = map_service.search_nearby_poi(
            float(lat), float(lng), poi_type, int(radius)
        )
        
        return jsonify({
            "status": "success",
            "pois": pois
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@main_bp.route('/api/suggest', methods=['POST'])
def suggest():
    """
    地址搜索建议API
    请求体: {"query": "查询关键词", "region": "区域(可选)"}
    响应: {"status": "success", "suggestions": [地址建议列表]}
    """
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        region = data.get('region', '全国').strip()
        
        if not query:
            return jsonify({
                "status": "error",
                "message": "查询关键词不能为空"
            }), 400
        
        suggestions = map_service.get_suggestion(query, region)
        
        return jsonify({
            "status": "success",
            "suggestions": suggestions
        })
            
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
