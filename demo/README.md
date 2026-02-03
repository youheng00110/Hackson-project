# 多人会面点 Demo

## 使用说明

1. 配置环境变量（服务端 AK）
   - 可在项目根目录 .env 中设置：
     
     BAIDU_WEB_AK=你的服务端AK

2. 安装依赖：
   - pip install flask requests

3. 运行：
   - python meeting_point_server.py

4. 打开页面：
   - http://127.0.0.1:5000

5. 页面中填写浏览器端 AK 并加载地图

## 说明
- 服务器会自动读取 demo/.env 或 项目根目录 .env。
- 出行方式支持：步行 / 驾车 / 公交 / 骑行。
