from functools import wraps
from flask_login import current_user
from app.utils.responses import error

def admin_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not current_user.is_authenticated:
            return error("Authentication required", 401)
        if not getattr(current_user, "is_admin", False):
            return error("Admin access required", 403)
        return f(*args, **kwargs)
    return wrapper