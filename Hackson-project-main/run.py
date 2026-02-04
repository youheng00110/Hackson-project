"""
应用启动入口
"""
from app import create_app

app = create_app()

if __name__ == '__main__':
    print("=" * 50)
    print("多人会面点推荐系统")
    print("访问地址: http://localhost:5000")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5000, debug=True)
