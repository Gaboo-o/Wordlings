from flask import Blueprint, request, jsonify
from app.models import Word
from app import db
from app.utils.login import login_required
from rapidfuzz import fuzz
from pytrends.request import TrendReq

pytrends = TrendReq(hl='en-US', tz=360)

words_bp = Blueprint('words', __name__)

@words_bp.route('/<string:word_text>', methods=['GET'])
def get_word(word_text):
    # Check if the query param includeTrends is set
    include_trends = request.args.get('includeTrends', 'false').lower() == 'true'

    # Fetch the word from your database
    word_entry = Word.query.filter_by(word=word_text).first()
    if not word_entry:
        return jsonify({"error": f"Word '{word_text}' not found"}), 404

    response_data = {
        "word": word_entry.word,
        "definition": word_entry.definition,
        "examples": word_entry.examples  # assuming this is a list or string
    }

    # If trends are requested, fetch them
    if include_trends:
        try:
            pytrends.build_payload([word_text], cat=0, timeframe='today 5-y', geo='', gprop='')

            data = pytrends.interest_over_time()
            if data.empty:
                trend_data = []
            else:
                trend_data = [
                    {"date": date.strftime("%Y-%m"), "value": int(row[word_text])}
                    for date, row in data.iterrows()
                ]

            region_data = pytrends.interest_by_region(resolution='COUNTRY', inc_low_vol=True)
            top_region = region_data[word_text].idxmax() if not region_data.empty and word_text in region_data else None

            response_data["trends"] = trend_data
            response_data["topRegion"] = top_region

        except Exception as e:
            response_data["trends"] = []
            response_data["topRegion"] = None
            response_data["trendError"] = str(e)

    return jsonify(response_data), 200

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
#@login_required
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
#@login_required
def upvote(word_id):
    word = Word.query.get(word_id)
    if not word:
        return jsonify({"error": "Word not found"}), 404

    word.upvotes += 1
    db.session.commit()
    return jsonify({"upvotes": word.upvotes}), 200
