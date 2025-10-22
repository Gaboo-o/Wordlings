from flask import Blueprint, request, session, url_for, jsonify
from app import db
from app.models import User

auth_bp = Blueprint('auth', __name__, url_prefix='api/auth')

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    # Check for missing fields
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    # Check if username exists
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 400

    # Create and store user
    user = User(username=username)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    # Auto-login after signup
    session['user_id'] = user.id
    session['is_admin'] = user.is_admin

    return jsonify({'message': 'Signup successful', 'is_admin': user.is_admin}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user and user.check_password(password):
        session['user_id'] = user.id
        session['is_admin'] = user.is_admin
        
        # Redirect based on role
        if user.is_admin:
            return jsonify({'message': 'Login successful', 'redirect': url_for('admin.review_submissions')}), 200
        else:
            return jsonify({'message': 'Login successful', 'redirect': url_for('main.index')}), 200

    return jsonify({'error': 'Invalid credentials'}), 401

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    session.pop('is_admin', None)
    return jsonify({'message': 'Logged out successfully'}), 200
