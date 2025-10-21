from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

# blueprints
from .routes.auth import auth_bp
from .routes.words import words_bp
from .routes.admin import admin_bp

class Config:
    SECRET_KEY = 'temporary_secret_key'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///dictionary.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)

    # database
    db.init_app(app)
    with app.app_context():
        db.create_all()

    # blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(words_bp, url_prefix="/api/words")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    return app