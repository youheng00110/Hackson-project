"""测试 meeting_point_server 的 API 端点"""
import requests
import json

BASE_URL = "http://127.0.0.1:5000"

def test_meeting_points_api():
    """测试会面点计算 API"""
    url = f"{BASE_URL}/api/meeting_points"
    
    # 测试数据：2个人在北京不同位置
    payload = {
        "persons": [
            {
                "name": "张三",
                "lat": 39.915,
                "lng": 116.404,
                "mode": "driving",
                "depart_time": ""
            },
            {
                "name": "李四",
                "lat": 39.975,
                "lng": 116.414,
                "mode": "walking",
                "depart_time": ""
            }
        ],
        "city": "北京市",
        "query": "咖啡厅",
        "radius": 3000,
        "top_k": 3
    }
    
    print("测试会面点 API...")
    print(f"URL: {url}")
    print(f"请求数据: {json.dumps(payload, ensure_ascii=False, indent=2)}")
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        print(f"\n响应状态码: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"中心点: {result.get('center')}")
            candidates = result.get('candidates', [])
            print(f"找到 {len(candidates)} 个候选点")
            
            for i, c in enumerate(candidates, 1):
                print(f"\n候选点 {i}: {c.get('name')}")
                print(f"  地址: {c.get('address')}")
                print(f"  最长时间: {c.get('max_time')/60:.1f} 分钟")
                print(f"  最短时间: {c.get('min_time')/60:.1f} 分钟")
                print(f"  时间差: {c.get('gap')/60:.1f} 分钟")
                print(f"  评分: {c.get('score')}")
            
            return len(candidates) > 0
        else:
            print(f"错误响应: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ 连接失败！请确保服务器已启动: python meeting_point_server.py")
        return False
    except Exception as e:
        print(f"异常: {e}")
        return False


def test_homepage():
    """测试主页"""
    url = BASE_URL
    print("\n测试主页...")
    print(f"URL: {url}")
    
    try:
        response = requests.get(url, timeout=5)
        print(f"响应状态码: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ 主页加载成功")
            return True
        else:
            print(f"❌ 主页加载失败")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ 连接失败！请确保服务器已启动")
        return False
    except Exception as e:
        print(f"异常: {e}")
        return False


if __name__ == "__main__":
    print("="*60)
    print("Meeting Point Server Web 端测试")
    print("="*60)
    
    homepage_ok = test_homepage()
    print("\n" + "="*60)
    
    if homepage_ok:
        api_ok = test_meeting_points_api()
    else:
        api_ok = False
        print("\n⚠️ 跳过 API 测试（服务器未启动）")
    
    print("\n" + "="*60)
    print(f"主页: {'✅ 通过' if homepage_ok else '❌ 失败'}")
    print(f"API: {'✅ 通过' if api_ok else '❌ 失败'}")
    print("="*60)
