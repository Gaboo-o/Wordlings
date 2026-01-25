from flask import Blueprint, request, jsonify
from app import db
from rapidfuzz import fuzz
from pytrends.request import TrendReq
from flask_login import login_required, current_user
from app.models import Word, Upvote
from sqlalchemy.exc import IntegrityError
from app import limiter
from app.utils.embeddings import invalidate_cache

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
    base_q = Word.query.filter_by(status='approved')
    if sort_by == 'popular':
        base_q = base_q.order_by(Word.upvotes.desc())
    else:
        base_q = base_q.order_by(Word.word.asc())

    words = base_q.all()

    # Build a set of word_ids the current user has upvoted (single query)
    upvoted_ids = set()
    if current_user.is_authenticated:
        upvoted_ids = {
            u.word_id for u in Upvote.query
                .filter_by(user_id=current_user.id)
                .with_entities(Upvote.word_id).all()
        }

    out = []
    for w in words:
        d = w.to_dict()
        d["user_has_upvoted"] = (w.id in upvoted_ids)
        out.append(d)
    return jsonify(out), 200

@words_bp.route('/<int:word_id>', methods=['GET'])
def view_word(word_id):
    word = Word.query.get(word_id)
    if not word:
        return jsonify({"error": "Word not found"}), 404

    data = word.to_dict()

    # Add user_has_upvoted flag
    user_has_upvoted = False
    if current_user.is_authenticated:
        existing = Upvote.query.filter_by(user_id=current_user.id, word_id=word_id).first()
        user_has_upvoted = existing is not None

    data["user_has_upvoted"] = user_has_upvoted
    return jsonify(data), 200

@words_bp.route('/search', methods=['GET'])
def search():
    from flask_login import current_user
    q = (request.args.get('search') or '').strip()
    if not q:
        return jsonify([]), 200

    try:
        from rapidfuzz import fuzz
        use_rf = True
    except Exception:
        use_rf = False

    # Only approved words
    all_words = Word.query.filter_by(status='approved').all()

    ql = q.lower()
    results = []
    for w in all_words:
        w_word = (w.word or '').lower()
        w_def  = (w.definition or '').lower()
        w_ex   = (w.examples or '').lower()

        if use_rf:
            s1 = fuzz.partial_ratio(ql, w_word)
            s2 = fuzz.partial_ratio(ql, w_def)
            s3 = fuzz.partial_ratio(ql, w_ex)
            score = max(s1, s2, s3)
            # be a bit more permissive + always allow simple substring on word
            if score >= 55 or ql in w_word:
                results.append((w, score))
        else:
            # fallback: simple substring across fields
            if ql in w_word or ql in w_def or ql in w_ex:
                # weight word matches higher
                score = 100 if ql in w_word else 80 if ql in w_def else 60
                results.append((w, score))

    # sort by match score then upvotes
    results.sort(key=lambda x: (x[1], x[0].upvotes or 0), reverse=True)

    # add user_has_upvoted flag
    upvoted_ids = set()
    if current_user.is_authenticated:
        upvoted_ids = {wid for (wid,) in db.session.query(Upvote.word_id)
                       .filter(Upvote.user_id == current_user.id).all()}

    out = []
    for w, _score in results[:100]:
        d = w.to_dict()
        d["user_has_upvoted"] = (w.id in upvoted_ids)
        out.append(d)

    return jsonify(out), 200


@words_bp.route('/add', methods=['POST'])
@login_required
@limiter.limit("10/minute")
def add_word():
    data = request.get_json() or {}
    word_text = (data.get('word') or '').strip()
    definition = (data.get('definition') or '').strip()
    examples = (data.get('examples') or '').strip()

    # 🔹 Input validation
    if not word_text:
        return jsonify({"error": "Word is required"}), 400
    if len(word_text) > 50:
        return jsonify({"error": "Word too long (max 50 chars)"}), 400
    if len(definition) > 200:
        return jsonify({"error": "Definition too long (max 200 chars)"}), 400
    if len(examples) > 500:
        return jsonify({"error": "Examples too long (max 500 chars)"}), 400

    new_word = Word(
        word=word_text,
        definition=definition,
        examples=examples,
        status='pending',
        submitted_by=current_user.id
    )
    db.session.add(new_word)
    from app.utils.embeddings import save_cache
    save_cache({})
    db.session.commit()
    try:
        invalidate_cache()
    except Exception:
        pass
    return jsonify(new_word.to_dict()), 201


@words_bp.route('/upvote/<int:word_id>', methods=['POST'])
@login_required
def upvote(word_id):
    word = Word.query.get(word_id)
    if not word:
        return jsonify({"error": "Word not found"}), 404

    # If already upvoted, return current count (idempotent)
    existing = Upvote.query.filter_by(user_id=current_user.id, word_id=word_id).first()
    if existing:
        return jsonify({"upvotes": word.upvotes, "user_has_upvoted": True}), 200

    try:
        # Create upvote row (unique constraint enforces one per user/word)
        up = Upvote(user_id=current_user.id, word_id=word_id)
        db.session.add(up)

        # Increment counter
        word.upvotes = (word.upvotes or 0) + 1
        db.session.commit()
        return jsonify({"upvotes": word.upvotes, "user_has_upvoted": True}), 200

    except IntegrityError:
        # Another request beat us to it; refresh count and return
        db.session.rollback()
        db.session.refresh(word)
        return jsonify({"upvotes": word.upvotes, "user_has_upvoted": True}), 200

@words_bp.route('/submissions', methods=['GET'])
@login_required
def submissions():
    rows = (
        Word.query
        .filter(Word.submitted_by == current_user.id)
        .order_by(Word.created_at.desc())
        .all()
    )

    return jsonify([w.to_dict() for w in rows]), 200