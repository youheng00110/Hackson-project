"""
测试百度地图API密钥是否有效的脚本
"""
import requests
import json

def test_api_key():
    # 测试地理编码API
    ak = "iwanSLLaXU0mNHxKG6MpczCl8bCVsvSe"
    url = "http://api.map.baidu.com/geocoding/v3/"
    
    params = {
        "address": "北京市",
        "output": "json",
        "ak": ak
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        print(f"HTTP状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        result = response.json()
        print(f"解析后的结果: {json.dumps(result, indent=2, ensure_ascii=False)}")
        
        if result.get('status') == 0:
            print("✅ API密钥有效，地理编码成功")
        else:
            print(f"❌ API密钥可能无效或配额已满，错误码: {result.get('status')}, 错误信息: {result.get('message')}")
            
    except Exception as e:
        print(f"❌ 请求失败: {e}")

if __name__ == "__main__":
    test_api_key()