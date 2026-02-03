# 百度地图 API 测试程序

## 文件说明

### 1. map_test.html
浏览器端 JavaScript API 测试文件，提供可视化的地图界面和交互功能。

**功能：**
- ✅ 地图显示和交互（拖动、缩放、点击）
- ✅ 地理位置标记
- ✅ 路线规划（驾车/公交/步行/骑行）
- ✅ 地图控件（导航、比例尺、缩略图）
- ✅ 实时显示路线距离和时间

**使用方法：**
1. 打开 `map_test.html` 文件
2. 浏览器端 AK 已配置为：`PQs7CZEekMDpIjULh5eaG9OhuhNv1vsm`
3. 直接用浏览器打开文件即可使用

### 2. server_api_test.py
服务端 API 测试脚本，用于测试后端路线规划和地理编码功能。

**功能：**
- ✅ 地理编码（地址 → 经纬度）
- ✅ 逆地理编码（经纬度 → 地址）
- ✅ 驾车路线规划（支持多种策略）
- ✅ 公交路线规划
- ✅ 步行路线规划
- ✅ 骑行路线规划

**使用方法：**
1. 安装依赖：`pip install requests`
2. 服务端 AK 已配置为：`iwanSLLaXU0mNHxKG6MpczCl8bCVsvSe`
3. 直接运行：`python server_api_test.py`

## API Key 配置

本项目已配置好百度地图 API Keys：

### 浏览器端 AK (map_test.html)
- **已配置**: `PQs7CZEekMDpIjULh5eaG9OhuhNv1vsm`
- **用途**: 用于交互、地图显示、POI 搜索、路线可视化
- **位置**: 第 59 行
```html
<!-- 第 59 行 -->
<script type="text/javascript" src="https://api.map.baidu.com/api?v=3.0&ak=PQs7CZEekMDpIjULh5eaG9OhuhNv1vsm"></script>
```

### 服务端 AK (server_api_test.py)
- **已配置**: `iwanSLLaXU0mNHxKG6MpczCl8bCVsvSe`
- **用途**: 用于计算、路线规划、地理编码
- **位置**: 第 288 行
```python
# 第 288 行
SERVER_AK = "iwanSLLaXU0mNHxKG6MpczCl8bCVsvSe"
```

## 测试场景

### HTML 文件测试
1. 在地图上点击查看经纬度
2. 输入起点和终点，选择出行方式
3. 点击"路线规划"查看路线
4. 点击"添加标记点"在地图中心添加标记
5. 使用地图控件进行缩放、拖动等操作

### Python 脚本测试
运行脚本后会自动测试：
1. 地理编码：北京天安门
2. 逆地理编码：(39.915, 116.404)
3. 驾车路线：北京天安门 → 北京西站
4. 公交路线：北京天安门 → 北京西站
5. 步行路线：北京天安门 → 北京西站
6. 骑行路线：北京天安门 → 北京西站

## 注意事项

1. **浏览器端 AK** 和 **服务端 AK** 是不同的，请勿混用
2. 浏览器端 AK 需要在百度地图开放平台配置 **白名单**（域名或 IP）
3. 服务端 AK 需要配置 **IP 白名单** 或 **SN 校验**
4. 路线规划 API 有调用次数限制，请注意配额
5. 如果遇到跨域问题，建议使用本地 HTTP 服务器打开 HTML 文件

## 相关文档

- [百度地图开放平台](https://lbsyun.baidu.com/)
- [JavaScript API 文档](https://lbsyun.baidu.com/index.php?title=jspopular3.0)
- [Web服务 API 文档](https://lbsyun.baidu.com/index.php?title=webapi)
