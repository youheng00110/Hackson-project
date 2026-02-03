"""测试百度地图 API"""
import requests
import os

# 从环境变量或直接设置
BAIDU_WEB_AK = "iwanSLLaXU0mNHxKG6MpczCl8bCVsvSe"

def test_place_api():
    """测试 Place API V3"""
    url = "https://api.map.baidu.com/place/v3/around"
    params = {
        "query": "咖啡厅",
        "location": "39.915,116.404",
        "radius": 2000,
        "page_size": 10,
        "page_num": 0,
        "output": "json",
        "ak": BAIDU_WEB_AK
    }
    
    print("测试 Place API V3...")
    print(f"URL: {url}")
    print(f"参数: {params}")
    
    try:
        response = requests.get(url, params=params, timeout=10)
        result = response.json()
        print(f"\n响应状态: {result.get('status')}")
        print(f"消息: {result.get('message')}")
        if result.get('status') == 0:
            print(f"找到 {len(result.get('results', []))} 个结果")
            if result.get('results'):
                print(f"第一个: {result['results'][0].get('name')}")
            return True
        else:
            print(f"错误详情: {result}")
            return False
    except Exception as e:
        print(f"异常: {e}")
        return False


def test_direction_api():
    """测试路线规划 API"""
    url = "https://api.map.baidu.com/direction/v2/driving"
    params = {
        "origin": "39.915,116.404",
        "destination": "39.975,116.414",
        "tactics": 10,
        "output": "json",
        "ak": BAIDU_WEB_AK
    }
    
    print("\n\n测试 Direction API (驾车)...")
    print(f"URL: {url}")
    print(f"参数: {params}")
    
    try:
        response = requests.get(url, params=params, timeout=10)
        result = response.json()
        print(f"\n响应状态: {result.get('status')}")
        print(f"消息: {result.get('message')}")
        if result.get('status') == 0:
            routes = result.get('result', {}).get('routes', [])
            if routes:
                route = routes[0]
                print(f"距离: {route.get('distance')/1000:.2f} 公里")
                print(f"时间: {route.get('duration')/60:.0f} 分钟")
            return True
        else:
            print(f"错误详情: {result}")
            return False
    except Exception as e:
        print(f"异常: {e}")
        return False


if __name__ == "__main__":
    print("="*60)
    print("百度地图 API 测试")
    print("="*60)
    
    place_ok = test_place_api()
    direction_ok = test_direction_api()
    
    print("\n" + "="*60)
    print(f"Place API: {'✅ 通过' if place_ok else '❌ 失败'}")
    print(f"Direction API: {'✅ 通过' if direction_ok else '❌ 失败'}")
    print("="*60)
