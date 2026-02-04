"""
Flask应用工厂
"""
from flask import Flask
from .config import FlaskConfig


def create_app():
    """创建Flask应用实例"""
    app = Flask(__name__, 
                template_folder='../templates',
                static_folder='../static')
    
    # 加载配置
    app.config.from_object(FlaskConfig)
    
    # 注册路由
    from .routes import main_bp
    app.register_blueprint(main_bp)
    
    return app
