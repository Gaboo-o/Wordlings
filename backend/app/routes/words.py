from flask import Blueprint, render_template, request, redirect, url_for, session, jsonify
from ..models import Word
from ..db import db
from rapidfuzz import fuzz
from ..services.trends_service import fetch_trends_for_word

words_bp = Blueprint('words', __name__)

@words_bp.route('/')
def index():
    sort_by = request.args.get('sort', 'alphabetical')
    query = Word.query.filter_by(status='approved')

    if sort_by == 'popular':
        words = query.order_by(Word.upvotes.desc()).all()
    else:
        words = query.order_by(Word.word.asc()).all()

    return render_template('index.html', words=words)

@words_bp.route('/add', methods=['GET', 'POST'])
def add_word():
    if request.method == 'POST':
        new_word = Word(
            word=request.form['word'],
            definition=request.form['definition'],
            examples=request.form['examples'],
            status='pending',
            submitted_by=session.get('user_id', 'anonymous')
        )
        db.session.add(new_word)
        db.session.commit()
        return redirect(url_for('words.index'))
    return render_template('add_word.html')

@words_bp.route('/word/<int:id>')
def view_word(id):
    word = Word.query.get_or_404(id)
    trend_score, top_country, trend_chart_html = fetch_trends_for_word(word.word)
    return render_template(
        'words.html',
        word=word,
        trend_score=trend_score,
        top_country=top_country,
        trend_chart_html=trend_chart_html
    )

@words_bp.route('/search')
def search():
    searchTerm = request.args.get('search')
    sort_by = request.args.get('sort', 'alphabetical')

    if not searchTerm:
        return redirect(url_for('words.index', sort=sort_by))

    all_words = Word.query.filter_by(status='approved').all()
    results = []

    for w in all_words:
        score_word = fuzz.partial_ratio(searchTerm.lower(), w.word.lower())
        score_def = fuzz.partial_ratio(searchTerm.lower(), (w.definition or '').lower())
        score = max(score_word, score_def)
        if score > 60:
            results.append((w, score))

    results.sort(key=lambda x: (x[1], x[0].upvotes), reverse=True)
    matched_words = [r[0] for r in results]
    return render_template('index.html', words=matched_words)

@words_bp.route('/api/upvote/<int:id>', methods=['POST'])
def api_upvote(id):
    word = Word.query.get_or_404(id)
    word.upvotes += 1
    db.session.commit()
    return jsonify({'upvotes': word.upvotes})
