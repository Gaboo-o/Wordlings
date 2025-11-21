# app/routes/admin.py
from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from app.models import Word, User
from app import db

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

def require_admin():
    return current_user.is_authenticated and getattr(current_user, "is_admin", False)

@admin_bp.route('/pending', methods=['GET'])
@login_required
def get_pending_words():
    if not require_admin():
        return jsonify({"error": "Unauthorized"}), 403

    # Optional: join to show submitter username instead of id
    rows = (
        db.session.query(Word, User.username)
        .outerjoin(User, User.id == Word.submitted_by)
        .filter(Word.status == 'pending')
        .all()
    )
    payload = []
    for w, username in rows:
        d = w.to_dict()
        d["submitted_by_username"] = username
        payload.append(d)
    return jsonify(payload), 200

@admin_bp.route('/approve/<int:word_id>', methods=['POST'])
@login_required
def approve_word(word_id):
    if not require_admin():
        return jsonify({"error": "Unauthorized"}), 403

    word = Word.query.get(word_id)
    if not word:
        return jsonify({"error": "Word not found"}), 404

    # Only move pending → approved (no-ops otherwise)
    if word.status != 'pending':
        return jsonify({"message": f"Already {word.status}"}), 200

    word.status = 'approved'
    db.session.commit()
    return jsonify({"message": "Word approved", "id": word.id, "status": word.status}), 200

@admin_bp.route('/reject/<int:word_id>', methods=['POST'])
@login_required
def reject_word(word_id):
    if not require_admin():
        return jsonify({"error": "Unauthorized"}), 403

    word = Word.query.get(word_id)
    if not word:
        return jsonify({"error": "Word not found"}), 404

    if word.status != 'pending':
        return jsonify({"message": f"Already {word.status}"}), 200

    word.status = 'rejected'
    db.session.commit()
    return jsonify({"message": "Word rejected", "id": word.id, "status": word.status}), 200
