# 百度地图 API Keys 说明
# Baidu Map API Keys Documentation

## 概述 / Overview

本项目使用两个百度地图 API Key，分别用于不同的场景：
This project uses two Baidu Map API Keys for different purposes:

## 1. 浏览器端 AK (Browser-side API Key)

### 基本信息
- **Key**: `PQs7CZEekMDpIjULh5eaG9OhuhNv1vsm`
- **类型**: 浏览器端 JavaScript API
- **用途**: 用于交互 (For Interaction)

### 功能范围
- 地图显示和交互（拖动、缩放、点击）
- POI 地点搜索
- 地理位置标记
- 路线可视化展示
- 前端用户交互

### 使用位置
1. **front.py** - 前端导航系统
   - 通过环境变量 `BAIDU_MAP_AK` 配置
   - 用于地图显示、POI 搜索、路线展示
   
2. **api_test/map_test.html** - 浏览器端测试
   - 第 59 行直接配置
   - 用于测试浏览器端 API 功能

### 运行示例
```bash
# 前端系统
BAIDU_MAP_AK=PQs7CZEekMDpIjULh5eaG9OhuhNv1vsm python front.py

# 或直接打开 HTML
open api_test/map_test.html
```

## 2. 服务端 AK (Server-side API Key)

### 基本信息
- **Key**: `iwanSLLaXU0mNHxKG6MpczCl8bCVsvSe`
- **类型**: Web服务 API
- **用途**: 用于计算 (For Calculations)

### 功能范围
- 地理编码（地址 → 经纬度）
- 逆地理编码（经纬度 → 地址）
- 路线规划计算（驾车/公交/步行/骑行）
- 距离计算
- 时间估算
- 后端数据处理

### 使用位置
1. **api_test/server_api_test.py** - 服务端 API 测试
   - 第 288 行配置
   - 测试所有服务端 API 功能

### 运行示例
```bash
# 安装依赖
pip install requests

# 运行服务端测试
cd api_test
python server_api_test.py
```

## 重要注意事项 / Important Notes

### 1. 两个 Key 不可混用
- **浏览器端 AK** 只能用于前端 JavaScript API
- **服务端 AK** 只能用于后端 Web 服务 API
- 混用会导致认证失败

### 2. API 配额
- 每天配额：5000 次调用
- 共享配额，注意合理使用
- 超出配额后会返回错误

### 3. 安全配置
- 浏览器端 AK 需要配置白名单（域名或 IP）
- 服务端 AK 需要配置 IP 白名单或 SN 校验
- 不要在公开代码中暴露 Key（本项目为内部测试用）

### 4. 坐标系统
- 百度地图使用 **BD09 坐标系**（百度坐标系）
- 与高德地图的 GCJ-02（火星坐标系）不同
- 需要坐标转换时请注意

## 相关文档 / Documentation

- [百度地图开放平台](https://lbsyun.baidu.com/)
- [JavaScript API 文档](https://lbsyun.baidu.com/index.php?title=jspopular3.0)
- [Web服务 API 文档](https://lbsyun.baidu.com/index.php?title=webapi)

## 快速参考 / Quick Reference

| 场景 | 使用的 Key | 配置位置 |
|------|-----------|----------|
| 前端地图显示 | 浏览器端 AK | `BAIDU_MAP_AK` 环境变量 |
| POI 搜索 | 浏览器端 AK | `front.py` |
| 路线可视化 | 浏览器端 AK | `map_test.html` |
| 路线计算 | 服务端 AK | `server_api_test.py` |
| 地理编码 | 服务端 AK | `server_api_test.py` |
| 距离计算 | 服务端 AK | `server_api_test.py` |

---

最后更新：2026-02-03
Last Updated: 2026-02-03
