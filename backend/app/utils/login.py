from functools import wraps
from flask import session, jsonify, g
from app.models import User

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get('user_id')
        if user_id is None:
            return jsonify({"error": "Authentication required"}), 401
        
        # Optional: Load user object into Flask's global context (g)
        g.user = User.query.get(user_id)
        if g.user is None:
             return jsonify({"error": "Authentication required"}), 401
             
        return f(*args, **kwargs)
    return decorated_function
