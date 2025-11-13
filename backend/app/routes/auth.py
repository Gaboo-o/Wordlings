from flask import Blueprint, request, jsonify, url_for
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from app import db
from app.models import User

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/signup', methods=['POST'])
def signup():
    print('in /signup auth.py', flush=True)
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    print('in /signup auth.py username: ', username, 'password: ', password, flush=True)
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 400

    print('after if auth.py', flush=True)
    hashed_pw = generate_password_hash(password)
    user = User(username=username, password_hash=hashed_pw)
    db.session.add(user)
    db.session.commit()

    login_user(user)

    return jsonify({
        'message': 'Signup successful',
        'user_id': user.id,
        'is_admin': user.is_admin
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    login_user(user)

    redirect_url = (
        url_for('admin.review_submissions')
        if user.is_admin else url_for('main.index')
    )

    return jsonify({
        'message': 'Login successful',
        'redirect': redirect_url,
        'user_id': user.id,
        'is_admin': user.is_admin
    }), 200


@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out successfully'}), 200


@auth_bp.route('/status', methods=['GET'])
def status():
    if current_user.is_authenticated:
        return jsonify({'logged_in': True, 'user_id': current_user.id, 'is_admin': current_user.is_admin})
    return jsonify({'logged_in': False}), 200