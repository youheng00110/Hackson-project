"""
百度地图服务端 API 测试
用于测试路线规划、地理编码、逆地理编码等服务端功能
"""

import requests
import json
from typing import Dict, List, Tuple

class BaiduMapAPI:
    """百度地图服务端 API 封装类"""
    
    def __init__(self, ak: str):
        """
        初始化
        :param ak: 百度地图服务端 API Key
        """
        self.ak = ak
        self.base_url = "https://api.map.baidu.com"
    
    def geocoding(self, address: str, city: str = "") -> Dict:
        """
        地理编码：将地址转换为经纬度
        :param address: 地址
        :param city: 城市名（可选）
        :return: 响应结果
        """
        url = f"{self.base_url}/geocoding/v3/"
        params = {
            "address": address,
            "city": city,
            "output": "json",
            "ak": self.ak
        }
        
        try:
            response = requests.get(url, params=params)
            result = response.json()
            
            if result['status'] == 0:
                location = result['result']['location']
                print(f"✓ 地理编码成功：{address}")
                print(f"  经度：{location['lng']}, 纬度：{location['lat']}")
                return result
            else:
                print(f"✗ 地理编码失败：{result.get('message', '未知错误')}")
                return result
        except Exception as e:
            print(f"✗ 请求异常：{e}")
            return {"status": -1, "error": str(e)}
    
    def reverse_geocoding(self, lat: float, lng: float) -> Dict:
        """
        逆地理编码：将经纬度转换为地址
        :param lat: 纬度
        :param lng: 经度
        :return: 响应结果
        """
        url = f"{self.base_url}/reverse_geocoding/v3/"
        params = {
            "location": f"{lat},{lng}",
            "output": "json",
            "ak": self.ak
        }
        
        try:
            response = requests.get(url, params=params)
            result = response.json()
            
            if result['status'] == 0:
                address = result['result']['formatted_address']
                print(f"✓ 逆地理编码成功：({lat}, {lng})")
                print(f"  地址：{address}")
                return result
            else:
                print(f"✗ 逆地理编码失败：{result.get('message', '未知错误')}")
                return result
        except Exception as e:
            print(f"✗ 请求异常：{e}")
            return {"status": -1, "error": str(e)}
    
    def route_planning_driving(self, origin: str, destination: str, 
                              origin_city: str = "", dest_city: str = "",
                              tactics: int = 10) -> Dict:
        """
        驾车路线规划
        :param origin: 起点（支持地址或经纬度"lat,lng"）
        :param destination: 终点（支持地址或经纬度"lat,lng"）
        :param origin_city: 起点城市
        :param dest_city: 终点城市
        :param tactics: 路线策略（10-最短时间，11-最短距离，12-避开高速）
        :return: 响应结果
        """
        url = f"{self.base_url}/direction/v2/driving"
        params = {
            "origin": origin,
            "destination": destination,
            "origin_region": origin_city,
            "destination_region": dest_city,
            "tactics": tactics,
            "output": "json",
            "ak": self.ak
        }
        
        try:
            response = requests.get(url, params=params)
            result = response.json()
            
            if result['status'] == 0:
                route = result['result']['routes'][0]
                print(f"✓ 驾车路线规划成功")
                print(f"  起点：{origin} → 终点：{destination}")
                print(f"  距离：{route['distance'] / 1000:.2f} 公里")
                print(f"  时间：{route['duration'] / 60:.0f} 分钟")
                print(f"  红绿灯：{route.get('light_num', 0)} 个")
                return result
            else:
                print(f"✗ 驾车路线规划失败：{result.get('message', '未知错误')}")
                return result
        except Exception as e:
            print(f"✗ 请求异常：{e}")
            return {"status": -1, "error": str(e)}
    
    def route_planning_transit(self, origin: str, destination: str, 
                              city: str, tactics_incity: int = 0) -> Dict:
        """
        公交路线规划
        :param origin: 起点（经纬度"lat,lng"）
        :param destination: 终点（经纬度"lat,lng"）
        :param city: 城市名
        :param tactics_incity: 策略（0-推荐，2-少换乘，3-少步行，5-不坐地铁）
        :return: 响应结果
        """
        url = f"{self.base_url}/direction/v2/transit"
        params = {
            "origin": origin,
            "destination": destination,
            "city": city,
            "tactics_incity": tactics_incity,
            "output": "json",
            "ak": self.ak
        }
        
        try:
            response = requests.get(url, params=params)
            result = response.json()
            
            if result['status'] == 0:
                route = result['result']['routes'][0]
                print(f"✓ 公交路线规划成功")
                print(f"  起点：{origin} → 终点：{destination}")
                print(f"  距离：{route['distance'] / 1000:.2f} 公里")
                print(f"  时间：{route['duration'] / 60:.0f} 分钟")
                return result
            else:
                print(f"✗ 公交路线规划失败：{result.get('message', '未知错误')}")
                return result
        except Exception as e:
            print(f"✗ 请求异常：{e}")
            return {"status": -1, "error": str(e)}
    
    def route_planning_walking(self, origin: str, destination: str) -> Dict:
        """
        步行路线规划
        :param origin: 起点（经纬度"lat,lng"）
        :param destination: 终点（经纬度"lat,lng"）
        :return: 响应结果
        """
        url = f"{self.base_url}/direction/v2/walking"
        params = {
            "origin": origin,
            "destination": destination,
            "output": "json",
            "ak": self.ak
        }
        
        try:
            response = requests.get(url, params=params)
            result = response.json()
            
            if result['status'] == 0:
                route = result['result']['routes'][0]
                print(f"✓ 步行路线规划成功")
                print(f"  起点：{origin} → 终点：{destination}")
                print(f"  距离：{route['distance'] / 1000:.2f} 公里")
                print(f"  时间：{route['duration'] / 60:.0f} 分钟")
                return result
            else:
                print(f"✗ 步行路线规划失败：{result.get('message', '未知错误')}")
                return result
        except Exception as e:
            print(f"✗ 请求异常：{e}")
            return {"status": -1, "error": str(e)}
    
    def route_planning_riding(self, origin: str, destination: str) -> Dict:
        """
        骑行路线规划
        :param origin: 起点（经纬度"lat,lng"）
        :param destination: 终点（经纬度"lat,lng"）
        :return: 响应结果
        """
        url = f"{self.base_url}/direction/v2/riding"
        params = {
            "origin": origin,
            "destination": destination,
            "output": "json",
            "ak": self.ak
        }
        
        try:
            response = requests.get(url, params=params)
            result = response.json()
            
            if result['status'] == 0:
                route = result['result']['routes'][0]
                print(f"✓ 骑行路线规划成功")
                print(f"  起点：{origin} → 终点：{destination}")
                print(f"  距离：{route['distance'] / 1000:.2f} 公里")
                print(f"  时间：{route['duration'] / 60:.0f} 分钟")
                return result
            else:
                print(f"✗ 骑行路线规划失败：{result.get('message', '未知错误')}")
                return result
        except Exception as e:
            print(f"✗ 请求异常：{e}")
            return {"status": -1, "error": str(e)}


def test_basic_functions(api: BaiduMapAPI):
    """测试基础功能"""
    print("\n" + "="*60)
    print("测试 1: 地理编码")
    print("="*60)
    result1 = api.geocoding("北京天安门", "北京市")
    
    print("\n" + "="*60)
    print("测试 2: 逆地理编码")
    print("="*60)
    result2 = api.reverse_geocoding(39.915, 116.404)


def test_route_planning(api: BaiduMapAPI):
    """测试路线规划功能"""
    
    # 先获取起点和终点的经纬度
    print("\n" + "="*60)
    print("准备：获取起点和终点经纬度")
    print("="*60)
    start = api.geocoding("北京天安门", "北京市")
    end = api.geocoding("北京西站", "北京市")
    
    if start['status'] == 0 and end['status'] == 0:
        start_loc = f"{start['result']['location']['lat']},{start['result']['location']['lng']}"
        end_loc = f"{end['result']['location']['lat']},{end['result']['location']['lng']}"
        
        # 驾车路线
        print("\n" + "="*60)
        print("测试 3: 驾车路线规划")
        print("="*60)
        api.route_planning_driving(start_loc, end_loc)
        
        # 公交路线
        print("\n" + "="*60)
        print("测试 4: 公交路线规划")
        print("="*60)
        api.route_planning_transit(start_loc, end_loc, "北京市")
        
        # 步行路线
        print("\n" + "="*60)
        print("测试 5: 步行路线规划")
        print("="*60)
        api.route_planning_walking(start_loc, end_loc)
        
        # 骑行路线
        print("\n" + "="*60)
        print("测试 6: 骑行路线规划")
        print("="*60)
        api.route_planning_riding(start_loc, end_loc)


def main():
    """主函数"""
    print("="*60)
    print("百度地图服务端 API 测试程序")
    print("="*60)
    
    # 在这里填入你的服务端 API Key
    SERVER_AK = "iwanSLLaXU0mNHxKG6MpczCl8bCVsvSe"
    
    if SERVER_AK == "YOUR_SERVER_AK_HERE":
        print("\n⚠ 警告：请先在代码中设置你的百度地图服务端 API Key！")
        print("找到 SERVER_AK = 'YOUR_SERVER_AK_HERE' 并替换为你的实际 AK")
        return
    
    # 创建 API 实例
    api = BaiduMapAPI(SERVER_AK)
    
    # 运行测试
    test_basic_functions(api)
    test_route_planning(api)
    
    print("\n" + "="*60)
    print("测试完成！")
    print("="*60)


if __name__ == "__main__":
    main()
