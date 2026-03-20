from flask import Blueprint
from flask_login import login_required
from app.models import Word, User
from app import db
from app.utils.decorators import admin_required
from app.utils.responses import success, error

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


@admin_bp.route('/pending', methods=['GET'])
@login_required
@admin_required
def get_pending_words():
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

    return success(payload)


@admin_bp.route('/approve/<int:word_id>', methods=['POST'])
@login_required
@admin_required
def approve_word(word_id):
    word = Word.query.get(word_id)
    if not word:
        return error("Word not found", 404)

    if word.status != 'pending':
        return success({"message": f"Already {word.status}"})

    word.status = 'approved'
    db.session.commit()
    return success({"id": word.id, "status": word.status})


@admin_bp.route('/reject/<int:word_id>', methods=['POST'])
@login_required
@admin_required
def reject_word(word_id):
    word = Word.query.get(word_id)
    if not word:
        return error("Word not found", 404)

    if word.status != 'pending':
        return success({"message": f"Already {word.status}"})

    word.status = 'rejected'
    db.session.commit()
    return success({"id": word.id, "status": word.status})