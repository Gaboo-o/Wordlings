from flask import Flask, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, current_user
from itsdangerous import URLSafeSerializer
from flask import g, request, jsonify, make_response
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from joblib import load
import os


db = SQLAlchemy()

# --- Security / Rate limit config ---
def _rate_key():
    # Per-user when authenticated; else fall back to client IP
    if current_user.is_authenticated:
        return f"user:{current_user.get_id()}"
    return get_remote_address()

limiter = Limiter(
    key_func=_rate_key,
    storage_uri="memory://",          # swap to Redis in prod: "redis://localhost:6379/0"
    default_limits=["200 per day", "50 per hour"],
)

# ---- existing imports of blueprints ----
from .models import User
from .routes.auth import auth_bp
from .routes.words import words_bp
from .routes.admin import admin_bp
from .routes.trends import trends_bp
from .routes.ml import ml_bp

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-change-me')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///dictionary.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = False  # True in prod
    MAX_CONTENT_LENGTH = 1 * 1024 * 1024  # 🔹 1 MB request limit

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    model_path = os.path.join(app.root_path, "models", "word_trend_clf.joblib")
    model = None
    if os.path.exists(model_path):
        try:
            model = load(model_path)
            print("ML model loaded.")
        except Exception as e:
            print("Failed to load ML model:", e)

    app.config['MODEL'] = model

    # Security headers (Talisman)
    Talisman(
        app,
        content_security_policy={
            "default-src": ["'self'"],
            "script-src": ["'self'", "'unsafe-inline'"],  # relax if needed for dev
            "style-src": ["'self'", "'unsafe-inline'"],
            "img-src": ["'self'","data:"],
            "connect-src": ["'self'"],   # frontend dev proxy still hits same origin if using Vite proxy
        },
        frame_options="DENY",
        force_https=False,  # set True in prod (with HTTPS)
    )

    CORS(app, supports_credentials=True, resources={
    r"/api/*": {"origins": "http://localhost:5173"}  # 🔹 dev frontend
})


    db.init_app(app)
    with app.app_context():
        db.create_all()

    login_manager = LoginManager()
    login_manager.login_view = 'auth.login'
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Init limiter
    limiter.init_app(app)

    # Register blueprints (avoid duplicate prefixes)
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(words_bp,  url_prefix="/api/words")
    app.register_blueprint(trends_bp, url_prefix="/api/trends")

    serializer = URLSafeSerializer(app.config['SECRET_KEY'], salt="csrf")

    @app.after_request
    def set_csrf_cookie(resp):
        # Set a CSRF token cookie if missing (HttpOnly=False so frontend JS can read it)
        if not request.cookies.get("X-CSRF-Token"):
            token = serializer.dumps("ok")
            resp.set_cookie("X-CSRF-Token", token, samesite="Lax", secure=app.config['SESSION_COOKIE_SECURE'])
        return resp

    @app.before_request
    def verify_csrf():
        # Only protect state-changing methods
        if request.method in ("POST", "PUT", "PATCH", "DELETE"):
            # Allow login/signup to also be protected the same way
            token_cookie = request.cookies.get("X-CSRF-Token")
            token_header = request.headers.get("X-CSRF-Token")
            if not token_cookie or not token_header or token_cookie != token_header:
                return jsonify({"error": "CSRF token missing or invalid"}), 403

    app.register_blueprint(ml_bp)
    return app

