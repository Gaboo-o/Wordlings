from flask import Flask, render_template, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from rapidfuzz import fuzz, process
#test
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dictionary.db'
db = SQLAlchemy(app)


class Word(db.Model):
    upvotes = db.Column(db.Integer, default=0)
    id = db.Column(db.Integer, primary_key=True)
    word = db.Column(db.String(50), nullable=False)
    definition = db.Column(db.String(200))
    examples = db.Column(db.String(500))

with app.app_context():
    db.create_all()

@app.route('/')
def index():
    sort_by = request.args.get('sort', 'alphabetical')
    if sort_by == 'popular':
        words = Word.query.order_by(Word.upvotes.desc()).all()
    else:
        words = Word.query.order_by(Word.word.asc()).all()
    return render_template('index.html', words=words)

@app.route('/add', methods=['GET', 'POST'])
def add_word():
    if request.method == 'POST':
        new_word = Word(
            word=request.form['word'],
            definition=request.form['definition'],
            examples=request.form['examples']
        )
        db.session.add(new_word)
        db.session.commit()
        return redirect(url_for('index'))
    return render_template('add_word.html')

@app.route('/delete/<int:id>')
def delete_word(id):
    word = Word.query.get_or_404(id)
    db.session.delete(word)
    db.session.commit()
    return redirect(url_for('index'))

@app.route('/word/<int:id>')
def view_word(id):
    word = Word.query.get_or_404(id)
    return render_template('word.html', word=word)


@app.route('/search')
def search():
    searchTerm = request.args.get('search')
    sort_by = request.args.get('sort', 'alphabetical')  # 'popular' or 'alphabetical'

    # If no search term, redirect to index
    if not searchTerm:
        if sort_by == 'popular':
            words = Word.query.order_by(Word.upvotes.desc()).all()
        else:
            words = Word.query.order_by(Word.word.asc()).all()
        return render_template('index.html', words=words)

    # Grab all words from DB
    all_words = Word.query.all()
    results = []

    # Fuzzy match on both word and definition
    for w in all_words:
        score_word = fuzz.partial_ratio(searchTerm.lower(), w.word.lower())
        score_def = fuzz.partial_ratio(searchTerm.lower(), (w.definition or '').lower())
        score = max(score_word, score_def)
        if score > 60:  # threshold (tweak this)
            results.append((w, score))

    # Sort by best match (and popularity if equal)
    results.sort(key=lambda x: (x[1], x[0].upvotes), reverse=True)
    matched_words = [r[0] for r in results]

    return render_template('index.html', words=matched_words)

@app.route('/upvote/<int:id>', methods=['POST'])
def upvote(id):
    word = Word.query.get_or_404(id)
    word.upvotes += 1
    db.session.commit()
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)

