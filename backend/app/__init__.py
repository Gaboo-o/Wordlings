from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager

db = SQLAlchemy()

# user model
from .models import User

# blueprints
from .routes.auth import auth_bp
from .routes.words import words_bp
from .routes.admin import admin_bp

class Config:
    SECRET_KEY = 'temporary_secret_key'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///dictionary.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)

    # database
    db.init_app(app)
    with app.app_context():
        db.create_all()

    # user accounts
    login_manager = LoginManager()
    login_manager.login_view = 'auth.login'
    login_manager.init_app(app)
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(words_bp, url_prefix="/api/words")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    return app