"""
配置文件 - 百度地图API密钥和应用参数
"""

# 百度地图API密钥
BAIDU_SERVER_AK = "iwanSLLaXU0mNHxKG6MpczCl8bCVsvSe"  # 服务端AK
BAIDU_BROWSER_AK = "PQs7CZEekMDpIjULh5eaG9OhuhNv1vsm"  # 浏览器端AK

# 出行方式枚举
class TravelMode:
    DRIVING = "driving"      # 驾车
    TRANSIT = "transit"      # 公交
    WALKING = "walking"      # 步行
    RIDING = "riding"        # 骑行

# POI类型映射
POI_TYPES = {
    "餐厅": "餐厅",
    "咖啡厅": "咖啡厅",
    "商场": "购物中心",
    "公园": "公园",
    "电影院": "电影院",
    "KTV": "KTV",
    "酒吧": "酒吧",
    "茶馆": "茶馆",
}

# 算法参数
class AlgorithmConfig:
    # POI搜索半径（米），按优先级递增
    SEARCH_RADIUS_LEVELS = [2000, 3000, 5000]
    # 每轮搜索的POI数量
    POI_PAGE_SIZE = 20
    # 最小候选POI数量
    MIN_POI_COUNT = 5
    # 最大候选POI数量（用于评估）
    MAX_POI_COUNT = 30
    # 返回推荐结果数量
    TOP_RESULTS = 5
    # 路线计算超时（秒）
    ROUTE_TIMEOUT = 10
    # 最大并发线程数
    MAX_WORKERS = 10

# Flask应用配置
class FlaskConfig:
    DEBUG = True
    SECRET_KEY = "meeting-point-finder-secret-key"
    JSON_AS_ASCII = False  # 支持中文JSON响应
