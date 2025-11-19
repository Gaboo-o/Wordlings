from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, current_user
from itsdangerous import URLSafeSerializer
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from joblib import load
import os


db = SQLAlchemy()

# --- Security / Rate limit config ---
def _rate_key():
    if current_user.is_authenticated:
        return f"user:{current_user.get_id()}"
    return get_remote_address()

limiter = Limiter(
    key_func=_rate_key,
    storage_uri="memory://",
    default_limits=["200 per day", "50 per hour"],
)

# ---- blueprints ----
from .models import User
from .routes.auth import auth_bp
from .routes.words import words_bp
# from .routes.admin import admin_bp            # optional: comment out if not using
from .routes.trends import trends_bp
from .routes.ml import ml_bp
from .routes.similar import similar_bp

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-change-me')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///dictionary.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = False  # True in prod
    MAX_CONTENT_LENGTH = 1 * 1024 * 1024  # 1 MB

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Load ML model (optional)
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
            "script-src": ["'self'", "'unsafe-inline'"],   # relax for dev
            "style-src": ["'self'", "'unsafe-inline'"],
            "img-src": ["'self'", "data:"],
            "connect-src": ["'self'"],
        },
        frame_options="DENY",
        force_https=False,  # True in prod (with HTTPS)
    )

    # CORS
    CORS(app, supports_credentials=True, resources={
        r"/api/*": {"origins": "http://localhost:5173"}
    })

    # DB
    db.init_app(app)
    with app.app_context():
        db.create_all()

    # Auth
    login_manager = LoginManager()
    login_manager.login_view = 'auth.login'
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Rate limiter
    limiter.init_app(app)

    # Blueprints (register each ONCE)
    app.register_blueprint(auth_bp)                                 # /api/auth inside bp
    # app.register_blueprint(admin_bp)                               # optional
    app.register_blueprint(words_bp,  url_prefix="/api/words")
    app.register_blueprint(trends_bp, url_prefix="/api/trends")
    app.register_blueprint(similar_bp)                               # has url_prefix="/api/words"
    app.register_blueprint(ml_bp)                                    # e.g. /api/ml/...

    # CSRF (double-submit)
    serializer = URLSafeSerializer(app.config['SECRET_KEY'], salt="csrf")

    @app.after_request
    def set_csrf_cookie(resp):
        if not request.cookies.get("X-CSRF-Token"):
            token = serializer.dumps("ok")
            resp.set_cookie(
                "X-CSRF-Token", token,
                samesite="Lax",
                secure=app.config['SESSION_COOKIE_SECURE']
            )
        return resp

    @app.before_request
    def verify_csrf():
        # Allow CORS preflight
        if request.method == "OPTIONS":
            return None
        # Protect state-changing methods
        if request.method in ("POST", "PUT", "PATCH", "DELETE"):
            token_cookie = request.cookies.get("X-CSRF-Token")
            token_header = request.headers.get("X-CSRF-Token")
            if not token_cookie or not token_header or token_cookie != token_header:
                return jsonify({"error": "CSRF token missing or invalid"}), 403

    return app
