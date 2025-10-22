from flask import Blueprint, jsonify
from app.models import Word
from app import db

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

def is_admin():
    return True

@admin_bp.route('/pending', methods=['GET'])
def get_pending_words():
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 403
    
    pending_words = Word.query.filter_by(status='pending').all()
    return jsonify([word.to_dict() for word in pending_words]), 200

@admin_bp.route('/approve/<int:word_id>', methods=['POST'])
def approve_word(word_id):
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 403

    word = Word.query.get(word_id)
    if not word:
        return jsonify({"error": "Word not found"}), 404

    word.status = 'approved'
    db.session.commit()
    return jsonify({"message": "Word approved"}), 200

@admin_bp.route('/reject/<int:word_id>', methods=['POST'])
def reject_word(word_id):
    if not is_admin():
        return jsonify({"error": "Unauthorized"}), 403

    word = Word.query.get(word_id)
    if not word:
        return jsonify({"error": "Word not found"}), 404

    word.status = 'rejected'
    db.session.commit()
    return jsonify({"message": "Word rejected"}), 200
