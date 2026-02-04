"""
核心优化算法模块
实现多人会面点推荐的Minimax优化策略
"""
from typing import List, Dict, Optional, Tuple
from .baidu_map_service import map_service
from .config import AlgorithmConfig


class MeetingPointOptimizer:
    """会面点优化器"""
    
    def __init__(self):
        self.map_service = map_service
    
    def calculate_geometric_center(self, persons: List[Dict]) -> Tuple[float, float]:
        """
        计算所有人位置的几何中心
        :param persons: 人员列表 [{"lat": 纬度, "lng": 经度}, ...]
        :return: (中心纬度, 中心经度)
        """
        if not persons:
            raise ValueError("人员列表不能为空")
        
        total_lat = sum(p['lat'] for p in persons)
        total_lng = sum(p['lng'] for p in persons)
        n = len(persons)
        
        return (total_lat / n, total_lng / n)
    
    def find_optimal_meeting_points(self, persons: List[Dict], 
                                     poi_type: str, search_radius: int = 5000) -> Dict:
        """
        寻找最优会面点
        :param persons: 人员列表 [{"id": ID, "name": 姓名, "lat": 纬度, "lng": 经度, "travel_mode": 出行方式, "departure_time": 出发时间}, ...]
        :param poi_type: POI类型（如：餐厅、咖啡厅，支持逗号分隔的多个类型）
        :param search_radius: 搜索半径（米）
        :return: {
            "center": {"lat": 中心纬度, "lng": 中心经度},
            "meeting_points": [推荐会面点列表]
        }
        """
        if len(persons) < 2:
            raise ValueError("至少需要2个人")
        
        # 1. 计算几何中心
        center_lat, center_lng = self.calculate_geometric_center(persons)
        
        # 2. 处理多POI类型
        poi_types = poi_type.split(',')
        all_pois = []
        
        for single_type in poi_types:
            single_type = single_type.strip()
            if single_type:
                # 使用指定的搜索半径
                pois = self.map_service.search_poi_with_custom_radius(
                    center_lat, center_lng, single_type, search_radius
                )
                all_pois.extend(pois)
        
        # 去重，保持顺序
        seen_uids = set()
        unique_pois = []
        for poi in all_pois:
            if poi['uid'] not in seen_uids:
                seen_uids.add(poi['uid'])
                unique_pois.append(poi)
        
        if not unique_pois:
            # 如果指定半径内没有找到POI，尝试扩大搜索半径
            fallback_radii = [search_radius * 2, search_radius * 3, 10000]  # 逐步扩大搜索范围
            for fallback_radius in fallback_radii:
                print(f"扩大搜索半径至 {fallback_radius} 米")
                for single_type in poi_types:
                    single_type = single_type.strip()
                    if single_type:
                        pois = self.map_service.search_poi_with_custom_radius(
                            center_lat, center_lng, single_type, fallback_radius
                        )
                        for poi in pois:
                            if poi['uid'] not in seen_uids:
                                seen_uids.add(poi['uid'])
                                unique_pois.append(poi)
                        
                        if len(unique_pois) >= AlgorithmConfig.MIN_POI_COUNT:
                            break
                if len(unique_pois) >= AlgorithmConfig.MIN_POI_COUNT:
                    break
            
            if not unique_pois:
                # 如果仍然找不到POI，创建虚拟的几何中心点作为备选
                print("使用几何中心点作为备选会面点")
                virtual_center_poi = {
                    "name": "几何中心点",
                    "address": f"中心坐标附近",
                    "lat": center_lat,
                    "lng": center_lng,
                    "uid": f"virtual_center_{center_lat}_{center_lng}"
                }
                unique_pois = [virtual_center_poi]
            
            # 如果还是没有POI，返回空结果
            if not unique_pois:
                return {
                    "center": {"lat": center_lat, "lng": center_lng},
                    "meeting_points": [],
                    "error": f"未找到附近的{poi_type}"
                }
        
        # 4. 评估每个候选POI
        evaluated_points = []
        
        for poi in unique_pois:
            # 计算所有人到该POI的路线
            routes = self.map_service.batch_calculate_routes(
                persons, poi['lat'], poi['lng']
            )
            
            # 计算评分指标
            metrics = self._calculate_time_sync_metrics(routes, persons)
            
            if metrics['reachable_count'] > 0:
                evaluated_points.append({
                    "name": poi['name'],
                    "address": poi['address'],
                    "location": {"lat": poi['lat'], "lng": poi['lng']},
                    "uid": poi['uid'],
                    "max_duration": metrics['max_duration'],
                    "avg_duration": metrics['avg_duration'],
                    "total_duration": metrics['total_duration'],
                    "reachable_count": metrics['reachable_count'],
                    "arrival_time_variance": metrics['arrival_time_variance'],  # 到达时间方差
                    "time_sync_score": metrics['time_sync_score'],  # 时间同步评分
                    "total_count": len(persons),
                    "routes": routes
                })
        
        # 5. 按时间同步优化策略排序
        # 优先考虑到达时间更同步的点，其次是最小化最大到达时间
        evaluated_points.sort(key=lambda x: (
            x['time_sync_score'],  # 时间同步评分越低越好
            x['max_duration'] if x['max_duration'] else float('inf'),  # 然后按最大时间排序
            x['arrival_time_variance'] if x['arrival_time_variance'] else float('inf')  # 最后按到达时间方差排序
        ))
        
        # 6. 返回Top N结果
        top_results = evaluated_points[:AlgorithmConfig.TOP_RESULTS]
        
        # 添加排名
        for i, point in enumerate(top_results, 1):
            point['rank'] = i
        
        return {
            "center": {"lat": center_lat, "lng": center_lng},
            "meeting_points": top_results
        }
    
    def find_optimal_meeting_points_with_city(self, persons: List[Dict], 
                                             poi_type: str, meeting_city: str = "", search_radius: int = 5000) -> Dict:
        """
        寻找最优会面点（支持指定城市）
        :param persons: 人员列表 [{"id": ID, "name": 姓名, "lat": 纬度, "lng": 经度, "travel_mode": 出行方式, "departure_time": 出发时间}, ...]
        :param poi_type: POI类型（如：餐厅、咖啡厅，支持逗号分隔的多个类型）
        :param meeting_city: 期望的会面城市（可选）
        :return: {
            "center": {"lat": 中心纬度, "lng": 中心经度},
            "meeting_points": [推荐会面点列表]
        }
        """
        if len(persons) < 2:
            raise ValueError("至少需要2个人")
        
        # 1. 计算几何中心
        center_lat, center_lng = self.calculate_geometric_center(persons)
        
        # 2. 如果指定了城市，使用城市中心作为搜索中心点
        search_lat, search_lng = center_lat, center_lng
        if meeting_city:
            # 如果用户指定了城市，尝试获取该城市的中心坐标
            city_location = self.map_service.geocode(meeting_city)
            if city_location and 'lat' in city_location and 'lng' in city_location:
                search_lat, search_lng = city_location['lat'], city_location['lng']
        
        # 3. 处理多POI类型
        poi_types = poi_type.split(',')
        all_pois = []
        
        for single_type in poi_types:
            single_type = single_type.strip()
            if single_type:
                # 使用指定的搜索半径
                pois = self.map_service.search_poi_with_custom_radius(
                    search_lat, search_lng, single_type, search_radius
                )
                all_pois.extend(pois)
        
        # 去重，保持顺序
        seen_uids = set()
        unique_pois = []
        for poi in all_pois:
            if poi['uid'] not in seen_uids:
                seen_uids.add(poi['uid'])
                unique_pois.append(poi)
        
        if not unique_pois:
            return {
                "center": {"lat": center_lat, "lng": center_lng},
                "meeting_points": [],
                "error": f"未找到附近的{poi_type}"
            }
        
        # 4. 评估每个候选POI
        evaluated_points = []
        
        for poi in unique_pois:
            # 计算所有人到该POI的路线
            routes = self.map_service.batch_calculate_routes(
                persons, poi['lat'], poi['lng']
            )
            
            # 计算评分指标
            metrics = self._calculate_time_sync_metrics(routes, persons)
            
            if metrics['reachable_count'] > 0:
                evaluated_points.append({
                    "name": poi['name'],
                    "address": poi['address'],
                    "location": {"lat": poi['lat'], "lng": poi['lng']},
                    "uid": poi['uid'],
                    "max_duration": metrics['max_duration'],
                    "avg_duration": metrics['avg_duration'],
                    "total_duration": metrics['total_duration'],
                    "reachable_count": metrics['reachable_count'],
                    "arrival_time_variance": metrics['arrival_time_variance'],  # 到达时间方差
                    "time_sync_score": metrics['time_sync_score'],  # 时间同步评分
                    "total_count": len(persons),
                    "routes": routes
                })
        
        # 5. 按时间同步优化策略排序
        # 优先考虑到达时间更同步的点，其次是最小化最大到达时间
        evaluated_points.sort(key=lambda x: (
            x['time_sync_score'],  # 时间同步评分越低越好
            x['max_duration'] if x['max_duration'] else float('inf'),  # 然后按最大时间排序
            x['arrival_time_variance'] if x['arrival_time_variance'] else float('inf')  # 最后按到达时间方差排序
        ))
        
        # 6. 返回Top N结果
        top_results = evaluated_points[:AlgorithmConfig.TOP_RESULTS]
        
        # 添加排名
        for i, point in enumerate(top_results, 1):
            point['rank'] = i
        
        return {
            "center": {"lat": center_lat, "lng": center_lng},
            "meeting_points": top_results
        }
    
    def _calculate_time_sync_metrics(self, routes: List[Dict], persons: List[Dict]) -> Dict:
        """
        计算时间同步相关的评估指标
        :param routes: 路线列表
        :param persons: 人员列表（包含出发时间信息）
        :return: 包含时间同步指标的字典
        """
        durations = []
        arrival_times = []  # 实际到达时间（相对于某个参考点）
        
        for i, route in enumerate(routes):
            if route.get('duration') is not None and not route.get('unreachable'):
                duration = route['duration']
                durations.append(duration)
                
                # 计算到达时间（如果提供了出发时间，则基于出发时间计算）
                person = next((p for p in persons if p['id'] == route['person_id']), None)
                if person and person.get('departure_time'):
                    # 这里我们模拟计算到达时间，实际应用中可以更精确地处理时间
                    # 简化处理：到达时间 = 出发时间 + 旅程时间
                    # 我们使用相对时间单位来计算方差
                    departure_offset = self._convert_time_to_minutes(person['departure_time']) if person['departure_time'] else 0
                    arrival_time = departure_offset + (duration / 60)  # 转换为分钟
                    arrival_times.append(arrival_time)
                else:
                    # 如果没有出发时间，则仅基于旅程时间评估
                    arrival_times.append(duration / 60)  # 转换为分钟
    
        if not durations:
            return {
                "max_duration": None,
                "avg_duration": None,
                "total_duration": None,
                "arrival_time_variance": None,
                "time_sync_score": float('inf'),
                "reachable_count": 0
            }
        
        # 计算到达时间方差（衡量时间同步程度）
        avg_arrival_time = sum(arrival_times) / len(arrival_times)
        variance = sum((t - avg_arrival_time) ** 2 for t in arrival_times) / len(arrival_times)
        
        # 时间同步评分：方差越小，同步性越好
        # 为了平衡时间和同步性，我们将方差标准化并结合最大时间
        normalized_variance = variance / 100.0 if avg_arrival_time > 0 else variance  # 简单标准化
        time_sync_score = normalized_variance + (max(durations) / 3600.0)  # 加上最大时间（小时为单位）的影响
        
        return {
            "max_duration": max(durations),
            "avg_duration": sum(durations) / len(durations),
            "total_duration": sum(durations),
            "arrival_time_variance": variance,
            "time_sync_score": time_sync_score,
            "reachable_count": len(durations)
        }
    
    def _convert_time_to_minutes(self, time_str: str) -> float:
        """
        将时间字符串（HH:MM格式）转换为从午夜开始的分钟数
        :param time_str: 时间字符串，格式为 "HH:MM"
        :return: 从午夜开始的分钟数
        """
        try:
            hour, minute = time_str.split(':')
            return int(hour) * 60 + int(minute)
        except:
            return 0  # 默认为午夜
    
    def _calculate_metrics(self, routes: List[Dict]) -> Dict:
        """
        计算路线评估指标
        :param routes: 路线列表
        :return: {"max_duration": 最大时间, "avg_duration": 平均时间, "total_duration": 总时间, "reachable_count": 可达人数}
        """
        durations = []
        
        for route in routes:
            if route.get('duration') is not None and not route.get('unreachable'):
                durations.append(route['duration'])
        
        if not durations:
            return {
                "max_duration": None,
                "avg_duration": None,
                "total_duration": None,
                "reachable_count": 0
            }
        
        return {
            "max_duration": max(durations),
            "avg_duration": sum(durations) / len(durations),
            "total_duration": sum(durations),
            "reachable_count": len(durations)
        }


def format_duration(seconds: Optional[float]) -> str:
    """格式化时间显示"""
    if seconds is None:
        return "不可达"
    
    minutes = seconds / 60
    if minutes < 60:
        return f"{minutes:.0f}分钟"
    else:
        hours = minutes // 60
        mins = minutes % 60
        return f"{hours:.0f}小时{mins:.0f}分钟"


def format_distance(meters: Optional[float]) -> str:
    """格式化距离显示"""
    if meters is None:
        return "不可达"
    
    if meters < 1000:
        return f"{meters:.0f}米"
    else:
        return f"{meters/1000:.1f}公里"


# 创建全局优化器实例
optimizer = MeetingPointOptimizer()
