from flask import Blueprint, request
from flask_login import login_required, current_user
from sqlalchemy.exc import IntegrityError

from app import db, limiter
from app.models import Word, Upvote
from app.services.trends_service import fetch_trends
from app.utils.embeddings import invalidate_cache
from app.utils.responses import success, error
from app.utils.validation import validate_word_payload

words_bp = Blueprint("words", __name__)


@words_bp.route("/<string:word_text>", methods=["GET"])
def get_word(word_text: str):
    include_trends = request.args.get("includeTrends", "false").lower() == "true"

    word_entry = Word.query.filter_by(word=word_text).first()
    if not word_entry:
        return error(f"Word '{word_text}' not found", 404)

    # Preserve current shape (word/definition/examples) rather than returning full to_dict()
    response_data = {
        "word": word_entry.word,
        "definition": word_entry.definition,
        "examples": word_entry.examples,
    }

    if include_trends:
        try:
            trend_data, top_region = fetch_trends(word_text)
            response_data["trends"] = trend_data
            response_data["topRegion"] = top_region
        except Exception:
            # Don’t leak internal error strings to clients; just provide safe fallbacks
            response_data["trends"] = []
            response_data["topRegion"] = None

    return success(response_data)


@words_bp.route("/", methods=["GET"])
def index():
    sort_by = request.args.get("sort", "alphabetical")
    base_q = Word.query.filter_by(status="approved")

    if sort_by == "popular":
        base_q = base_q.order_by(Word.upvotes.desc())
    else:
        base_q = base_q.order_by(Word.word.asc())

    words = base_q.all()

    # Single query: which words has this user upvoted?
    upvoted_ids = set()
    if current_user.is_authenticated:
        upvoted_ids = {
            wid for (wid,) in db.session.query(Upvote.word_id)
            .filter(Upvote.user_id == current_user.id)
            .all()
        }

    out = []
    for w in words:
        d = w.to_dict()
        d["user_has_upvoted"] = (w.id in upvoted_ids)
        out.append(d)

    return success(out)


@words_bp.route("/<int:word_id>", methods=["GET"])
def view_word(word_id: int):
    word = Word.query.get(word_id)
    if not word:
        return error("Word not found", 404)

    data = word.to_dict()

    user_has_upvoted = False
    if current_user.is_authenticated:
        existing = Upvote.query.filter_by(user_id=current_user.id, word_id=word_id).first()
        user_has_upvoted = existing is not None

    data["user_has_upvoted"] = user_has_upvoted
    return success(data)


@words_bp.route("/search", methods=["GET"])
def search():
    q = (request.args.get("search") or "").strip()
    if not q:
        return success([])

    # Try rapidfuzz if available; fall back to substring search
    try:
        from rapidfuzz import fuzz  # type: ignore
        use_rf = True
    except Exception:
        fuzz = None
        use_rf = False

    all_words = Word.query.filter_by(status="approved").all()

    ql = q.lower()
    results = []

    for w in all_words:
        w_word = (w.word or "").lower()
        w_def = (w.definition or "").lower()
        w_ex = (w.examples or "").lower()

        if use_rf and fuzz is not None:
            s1 = fuzz.partial_ratio(ql, w_word)
            s2 = fuzz.partial_ratio(ql, w_def)
            s3 = fuzz.partial_ratio(ql, w_ex)
            score = max(s1, s2, s3)

            # permissive threshold + always allow substring on word
            if score >= 55 or ql in w_word:
                results.append((w, score))
        else:
            if ql in w_word or ql in w_def or ql in w_ex:
                score = 100 if ql in w_word else 80 if ql in w_def else 60
                results.append((w, score))

    # sort by match score then upvotes
    results.sort(key=lambda x: (x[1], x[0].upvotes or 0), reverse=True)

    upvoted_ids = set()
    if current_user.is_authenticated:
        upvoted_ids = {
            wid for (wid,) in db.session.query(Upvote.word_id)
            .filter(Upvote.user_id == current_user.id)
            .all()
        }

    out = []
    for w, _score in results[:100]:
        d = w.to_dict()
        d["user_has_upvoted"] = (w.id in upvoted_ids)
        out.append(d)

    return success(out)


@words_bp.route("/add", methods=["POST"])
@login_required
@limiter.limit("10/minute")
def add_word():
    data = request.get_json() or {}
    validated, err_msg = validate_word_payload(data)

    if err_msg:
        return error(err_msg, 400)

    new_word = Word(
        word=validated["word"],
        definition=validated["definition"],
        examples=validated["examples"],
        status="pending",
        submitted_by=current_user.id,
    )

    db.session.add(new_word)
    db.session.commit()

    # Invalidate embeddings cache if used elsewhere
    try:
        invalidate_cache()
    except Exception:
        pass

    return success(new_word.to_dict(), 201)


@words_bp.route("/upvote/<int:word_id>", methods=["POST"])
@login_required
def upvote(word_id: int):
    word = Word.query.get(word_id)
    if not word:
        return error("Word not found", 404)

    existing = Upvote.query.filter_by(user_id=current_user.id, word_id=word_id).first()
    if existing:
        return success({"upvotes": word.upvotes, "user_has_upvoted": True})

    try:
        up = Upvote(user_id=current_user.id, word_id=word_id)
        db.session.add(up)

        word.upvotes = (word.upvotes or 0) + 1
        db.session.commit()

        return success({"upvotes": word.upvotes, "user_has_upvoted": True})

    except IntegrityError:
        db.session.rollback()
        db.session.refresh(word)
        return success({"upvotes": word.upvotes, "user_has_upvoted": True})


@words_bp.route("/submissions", methods=["GET"])
@login_required
def submissions():
    rows = (
        Word.query
        .filter(Word.submitted_by == current_user.id)
        .order_by(Word.created_at.desc())
        .all()
    )

    return success([w.to_dict() for w in rows])