<h1 style="color: yellow;">Hackson-project</h1>

 Demo
 =============

概览（要解决的问题）
-----------------------

目标：给定 N人的当前位置 + 出行方式（步行/驾车/公交/骑行）＋出发时间，自动找出一个或若干“候选会面点”，使得每个人到该点的通勤时间差异较小（比如到达时长接近、或最大到达时间最小化），并在真实地图上显示（用高德/百度地图 API 做路由/时间估算和可视化）。
![alt text](image.png)
![alt text](image-1.png)


当前进展
======
**目前已经申请到了高德和百度的api，每天配额5000。我在apitest里测试了百度的，是ok的。大家也可以自行运行一下，一天5000次应该还是够用**

## 百度地图 API Keys

项目已配置两个百度地图 API Key，分别用于不同场景：

### 浏览器端 AK (用于交互)
- **Key**: `PQs7CZEekMDpIjULh5eaG9OhuhNv1vsm`
- **用途**: 前端地图显示、POI 搜索、路线可视化
- **使用位置**: `front.py`, `api_test/map_test.html`

### 服务端 AK (用于计算)
- **Key**: `iwanSLLaXU0mNHxKG6MpczCl8bCVsvSe`
- **用途**: 后端路线计算、地理编码、距离计算
- **使用位置**: `api_test/server_api_test.py`

**注意**: 两个 AK 功能不同，请勿混用。详见 `.env.example` 文件。

## 前端导航系统
已实现基于百度地图的导航系统前端（`front.py`），功能包括：
- ✅ 百度地图显示和交互
- ✅ POI 地点搜索
- ✅ 起点/终点输入与路线规划（驾车/步行/公交/骑行）
- ✅ 友好的用户界面

### 快速开始
```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 使用浏览器端 API Key 运行前端
BAIDU_MAP_AK=PQs7CZEekMDpIjULh5eaG9OhuhNv1vsm python front.py

# 3. 打开浏览器访问
http://localhost:5000
```

详细使用说明请查看 `front.py` 文件顶部的注释。

PS：
----
**1. 百度用的是百度坐标系，和高德的火星坐标系不一样，记得注意一下，不过百度好像只是坐标转换**

**2. 好像要交互得用浏览器api，要规划之类的要用服务端api**
