from flask import Blueprint, request, jsonify
from app.models import Word
from app import db
from rapidfuzz import fuzz

words_bp = Blueprint('words', __name__, url_prefix='/api/words')

@words_bp.route('/', methods=['GET'])
def index():
    sort_by = request.args.get('sort', 'alphabetical')
    if sort_by == 'popular':
        words = Word.query.filter_by(status='approved').order_by(Word.upvotes.desc()).all()
    else:
        words = Word.query.filter_by(status='approved').order_by(Word.word.asc()).all()

    return jsonify([w.to_dict() for w in words]), 200

@words_bp.route('/<int:word_id>', methods=['GET'])
def view_word(word_id):
    word = Word.query.get(word_id)
    if not word:
        return jsonify({"error": "Word not found"}), 404
    return jsonify(word.to_dict()), 200

@words_bp.route('/search', methods=['GET'])
def search():
    searchTerm = request.args.get('search', '')
    if not searchTerm:
        return jsonify({"error": "No search term provided"}), 400

    all_words = Word.query.filter_by(status='approved').all()
    results = []
    for w in all_words:
        score_word = fuzz.partial_ratio(searchTerm.lower(), w.word.lower())
        score_def = fuzz.partial_ratio(searchTerm.lower(), (w.definition or '').lower())
        score = max(score_word, score_def)
        if score > 60:
            results.append((w, score))

    results.sort(key=lambda x: (x[1], x[0].upvotes), reverse=True)
    matched_words = [r[0].to_dict() for r in results]

    return jsonify(matched_words), 200

@words_bp.route('/add', methods=['POST'])
def add_word():
    data = request.get_json() or {}
    word_text = data.get('word')
    if not word_text:
        return jsonify({"error": "Word is required"}), 400

    new_word = Word(
        word=word_text,
        definition=data.get('definition', ''),
        examples=data.get('examples', ''),
        status='approved',
    )

    db.session.add(new_word)
    db.session.commit()

    return jsonify(new_word.to_dict()), 201

@words_bp.route('/upvote/<int:word_id>', methods=['POST'])
def upvote(word_id):
    word = Word.query.get(word_id)
    if not word:
        return jsonify({"error": "Word not found"}), 404

    word.upvotes += 1
    db.session.commit()
    return jsonify({"upvotes": word.upvotes}), 200
