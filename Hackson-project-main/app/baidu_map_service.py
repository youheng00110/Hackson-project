"""
百度地图API服务封装层
提供地理编码、POI搜索、路线规划等功能
"""
import requests
from typing import Dict, List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
from .config import BAIDU_SERVER_AK, TravelMode, AlgorithmConfig


class BaiduMapService:
    """百度地图服务封装类"""
    
    def __init__(self, ak: str = BAIDU_SERVER_AK):
        self.ak = ak
        self.base_url = "https://api.map.baidu.com"
    
    def geocode(self, address: str, city: str = "") -> Optional[Dict]:
        """
        地理编码：将地址转换为经纬度
        :param address: 地址
        :param city: 城市名（可选）
        :return: {"lng": 经度, "lat": 纬度, "address": 地址} 或 None
        """
        url = f"{self.base_url}/geocoding/v3/"
        params = {
            "address": address,
            "city": city,
            "output": "json",
            "ak": self.ak
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            result = response.json()
            
            if result.get('status') == 0:
                location = result['result']['location']
                return {
                    "lng": location['lng'],
                    "lat": location['lat'],
                    "address": address
                }
            else:
                print(f"地理编码失败: {result.get('message', '未知错误')}")
                return None
        except Exception as e:
            print(f"地理编码请求异常: {e}")
            return None
    
    def reverse_geocode(self, lat: float, lng: float) -> Optional[str]:
        """
        逆地理编码：将经纬度转换为地址
        :param lat: 纬度
        :param lng: 经度
        :return: 地址字符串 或 None
        """
        url = f"{self.base_url}/reverse_geocoding/v3/"
        params = {
            "location": f"{lat},{lng}",
            "output": "json",
            "ak": self.ak
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            result = response.json()
            
            if result.get('status') == 0:
                return result['result']['formatted_address']
            return None
        except Exception as e:
            print(f"逆地理编码请求异常: {e}")
            return None
    
    def search_nearby_poi(self, lat: float, lng: float, query: str, 
                          radius: int = 2000, page_size: int = 20) -> List[Dict]:
        """
        周边POI搜索
        :param lat: 中心点纬度
        :param lng: 中心点经度
        :param query: 搜索关键词（如：餐厅、咖啡厅）
        :param radius: 搜索半径（米）
        :param page_size: 返回结果数量
        :return: POI列表 [{"name": 名称, "address": 地址, "lat": 纬度, "lng": 经度, "uid": 唯一ID}, ...]
        """
        import time
        url = f"{self.base_url}/place/v2/search"
        params = {
            "query": query,
            "location": f"{lat},{lng}",
            "radius": radius,
            "output": "json",
            "page_size": page_size,
            "ak": self.ak
        }
        
        # 尝试多次请求以提高成功率
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = requests.get(url, params=params, timeout=10)
                result = response.json()
                
                if result.get('status') == 0:
                    pois = []
                    for poi in result.get('results', []):
                        pois.append({
                            "name": poi.get('name', ''),
                            "address": poi.get('address', ''),
                            "lat": poi['location']['lat'],
                            "lng": poi['location']['lng'],
                            "uid": poi.get('uid', '')
                        })
                    return pois
                else:
                    print(f"POI搜索失败 (尝试 {attempt + 1}/{max_retries}): {result.get('message', '未知错误')}")
                    if attempt < max_retries - 1:
                        time.sleep(0.5)  # 等待一段时间后重试
                        continue
                    return []
            except Exception as e:
                print(f"POI搜索请求异常 (尝试 {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(0.5)  # 等待一段时间后重试
                    continue
                return []
        return []
    
    def search_poi_with_fallback(self, lat: float, lng: float, query: str) -> List[Dict]:
        """
        带降级策略的POI搜索
        如果结果不足，自动扩大搜索半径
        """
        for radius in AlgorithmConfig.SEARCH_RADIUS_LEVELS:
            pois = self.search_nearby_poi(lat, lng, query, radius, 
                                          AlgorithmConfig.POI_PAGE_SIZE)
            if len(pois) >= AlgorithmConfig.MIN_POI_COUNT:
                return pois[:AlgorithmConfig.MAX_POI_COUNT]
        return pois[:AlgorithmConfig.MAX_POI_COUNT] if pois else []
        
    def search_poi_with_custom_radius(self, lat: float, lng: float, query: str, radius: int) -> List[Dict]:
        """
        使用自定义半径的POI搜索
        :param lat: 中心点纬度
        :param lng: 中心点经度
        :param query: 搜索关键词
        :param radius: 搜索半径（米）
        :return: POI列表
        """
        pois = self.search_nearby_poi(lat, lng, query, radius, 
                                      AlgorithmConfig.POI_PAGE_SIZE)
        return pois[:AlgorithmConfig.MAX_POI_COUNT] if pois else []
    
    def calculate_route(self, origin_lat: float, origin_lng: float,
                        dest_lat: float, dest_lng: float,
                        travel_mode: str) -> Optional[Dict]:
        """
        计算路线
        :param origin_lat: 起点纬度
        :param origin_lng: 起点经度
        :param dest_lat: 终点纬度
        :param dest_lng: 终点经度
        :param travel_mode: 出行方式 (driving/transit/walking/riding)
        :return: {"distance": 距离(米), "duration": 时间(秒), "path": 路径坐标点列表} 或 None
        """
        import time
        origin = f"{origin_lat},{origin_lng}"
        destination = f"{dest_lat},{dest_lng}"
        
        # 根据不同出行方式调用对应的路线规划
        route_func = None
        if travel_mode == TravelMode.DRIVING:
            route_func = self._route_driving
        elif travel_mode == TravelMode.TRANSIT:
            route_func = self._route_transit
        elif travel_mode == TravelMode.WALKING:
            route_func = self._route_walking
        elif travel_mode == TravelMode.RIDING:
            route_func = self._route_riding
        else:
            print(f"不支持的出行方式: {travel_mode}")
            return None
        
        # 尝试多次请求以提高成功率
        max_retries = 2
        for attempt in range(max_retries):
            try:
                result = route_func(origin, destination)
                if result:
                    return result
                elif attempt < max_retries - 1:
                    time.sleep(0.3)  # 等待后重试
                    continue
            except Exception as e:
                print(f"路线计算异常 (尝试 {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(0.3)  # 等待后重试
                    continue
        
        return None
    
    def _route_driving(self, origin: str, destination: str) -> Optional[Dict]:
        """驾车路线规划"""
        url = f"{self.base_url}/direction/v2/driving"
        params = {
            "origin": origin,
            "destination": destination,
            "tactics": 10,  # 最短时间
            "output": "json",
            "ak": self.ak
        }
        return self._parse_route_response(url, params)
    
    def _route_transit(self, origin: str, destination: str) -> Optional[Dict]:
        """公交路线规划"""
        url = f"{self.base_url}/direction/v2/transit"
        # 从坐标获取城市信息
        lat, lng = origin.split(',')
        city = self._get_city_from_location(float(lat), float(lng))
        
        params = {
            "origin": origin,
            "destination": destination,
            "city": city or "北京市",
            "tactics_incity": 0,  # 推荐策略
            "output": "json",
            "ak": self.ak
        }
        return self._parse_route_response(url, params, is_transit=True)
    
    def _route_walking(self, origin: str, destination: str) -> Optional[Dict]:
        """步行路线规划"""
        url = f"{self.base_url}/direction/v2/walking"
        params = {
            "origin": origin,
            "destination": destination,
            "output": "json",
            "ak": self.ak
        }
        return self._parse_route_response(url, params)
    
    def _route_riding(self, origin: str, destination: str) -> Optional[Dict]:
        """骑行路线规划"""
        url = f"{self.base_url}/direction/v2/riding"
        params = {
            "origin": origin,
            "destination": destination,
            "output": "json",
            "ak": self.ak
        }
        return self._parse_route_response(url, params)
    
    def _parse_route_response(self, url: str, params: Dict, 
                               is_transit: bool = False) -> Optional[Dict]:
        """解析路线响应"""
        try:
            response = requests.get(url, params=params, 
                                    timeout=AlgorithmConfig.ROUTE_TIMEOUT)
            result = response.json()
            
            if result.get('status') == 0:
                routes = result.get('result', {}).get('routes', [])
                if not routes:
                    return None
                
                route = routes[0]
                
                # 提取路径坐标点（用于地图绘制）
                path = []
                if is_transit:
                    # 公交路线的路径在steps中
                    for step in route.get('steps', []):
                        if isinstance(step, list):
                            for sub_step in step:
                                path.extend(self._parse_path_string(
                                    sub_step.get('path', '')))
                        else:
                            path.extend(self._parse_path_string(
                                step.get('path', '')))
                else:
                    # 驾车/步行/骑行路线
                    for step in route.get('steps', []):
                        path.extend(self._parse_path_string(step.get('path', '')))
                
                return {
                    "distance": route.get('distance', 0),
                    "duration": route.get('duration', 0),
                    "path": path
                }
            else:
                return None
        except Exception as e:
            print(f"路线规划请求异常: {e}")
            return None
    
    def _parse_path_string(self, path_str: str) -> List[Dict]:
        """解析路径字符串为坐标点列表"""
        if not path_str:
            return []
        
        points = []
        try:
            for point in path_str.split(';'):
                if ',' in point:
                    lng, lat = point.split(',')
                    points.append({"lng": float(lng), "lat": float(lat)})
        except:
            pass
        return points
    
    def _get_city_from_location(self, lat: float, lng: float) -> Optional[str]:
        """从坐标获取城市名称"""
        url = f"{self.base_url}/reverse_geocoding/v3/"
        params = {
            "location": f"{lat},{lng}",
            "output": "json",
            "ak": self.ak
        }
        
        try:
            response = requests.get(url, params=params, timeout=5)
            result = response.json()
            
            if result.get('status') == 0:
                return result['result']['addressComponent'].get('city', '北京市')
            return None
        except:
            return None
    
    def get_suggestion(self, query: str, region: str = "全国") -> List[Dict]:
        """
        获取地址搜索建议
        :param query: 查询关键词
        :param region: 搜索区域，默认为"全国"
        :return: 搜索建议列表 [{"name": 名称, "address": 地址, "city": 城市, "district": 区域}, ...]
        """
        url = f"{self.base_url}/place/v2/suggestion"
        params = {
            "query": query,
            "region": region,
            "output": "json",
            "ak": self.ak
        }
        
        try:
            response = requests.get(url, params=params, timeout=5)
            result = response.json()
            
            if result.get('status') == 0:
                suggestions = []
                for suggestion in result.get('result', []):
                    suggestions.append({
                        "name": suggestion.get('name', ''),
                        "address": suggestion.get('address', ''),
                        "city": suggestion.get('city', ''),
                        "district": suggestion.get('area', ''),
                        "location": suggestion.get('location', {})
                    })
                return suggestions
            else:
                print(f"搜索建议失败: {result.get('message', '未知错误')}")
                return []
        except Exception as e:
            print(f"搜索建议请求异常: {e}")
            return []
    
    def batch_calculate_routes(self, persons: List[Dict], 
                                dest_lat: float, dest_lng: float) -> List[Dict]:
        """
        批量计算多人到同一目的地的路线
        使用多线程提高性能
        :param persons: 人员列表 [{"id": ID, "lat": 纬度, "lng": 经度, "travel_mode": 出行方式}, ...]
        :param dest_lat: 目的地纬度
        :param dest_lng: 目的地经度
        :return: 路线结果列表 [{"person_id": ID, "distance": 距离, "duration": 时间, "path": 路径}, ...]
        """
        results = []
        
        with ThreadPoolExecutor(max_workers=AlgorithmConfig.MAX_WORKERS) as executor:
            future_to_person = {}
            
            for person in persons:
                future = executor.submit(
                    self.calculate_route,
                    person['lat'], person['lng'],
                    dest_lat, dest_lng,
                    person['travel_mode']
                )
                future_to_person[future] = person
            
            for future in as_completed(future_to_person):
                person = future_to_person[future]
                try:
                    route = future.result()
                    if route:
                        results.append({
                            "person_id": person['id'],
                            "person_name": person.get('name', ''),
                            "travel_mode": person['travel_mode'],
                            "distance": route['distance'],
                            "duration": route['duration'],
                            "path": route['path']
                        })
                    else:
                        # 路线计算失败，标记为不可达
                        results.append({
                            "person_id": person['id'],
                            "person_name": person.get('name', ''),
                            "travel_mode": person['travel_mode'],
                            "distance": None,
                            "duration": None,
                            "path": [],
                            "unreachable": True
                        })
                except Exception as e:
                    print(f"计算路线异常: {e}")
                    results.append({
                        "person_id": person['id'],
                        "person_name": person.get('name', ''),
                        "travel_mode": person['travel_mode'],
                        "distance": None,
                        "duration": None,
                        "path": [],
                        "unreachable": True
                    })
        
        return results


# 创建全局服务实例
map_service = BaiduMapService()
