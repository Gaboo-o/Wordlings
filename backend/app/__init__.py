from flask import Flask
from .db import db
from .config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    with app.app_context():
        from .routes.words import words_bp
        from .routes.auth import auth_bp
        from .routes.admin import admin_bp
        from .routes.trends import trends_bp

        app.register_blueprint(words_bp)
        app.register_blueprint(auth_bp)
        app.register_blueprint(admin_bp)
        app.register_blueprint(trends_bp)

        db.create_all()

    return app
