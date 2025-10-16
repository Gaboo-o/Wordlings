from flask import Flask, render_template, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from rapidfuzz import fuzz, process
from pytrends.request import TrendReq
import pandas as pd
import plotly.express as px

#test
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dictionary.db'
db = SQLAlchemy(app)
pytrends = TrendReq(hl='en-US', tz=360)

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


@app.route('/trends')
def trends():
    # Get slang words from your DB (limit to top 5 to keep performance fast)
    words = [w.word for w in Word.query.limit(5).all()]
    trend_data = []

    # Store country data for mapping
    country_data = pd.DataFrame()

    for word in words:
        try:
            # Get search interest over time
            pytrends.build_payload([word], cat=0, timeframe='today 3-m', geo='', gprop='')

            # Average popularity score for ranking
            interest = pytrends.interest_over_time()
            if not interest.empty:
                avg_score = int(interest[word].mean())
                trend_data.append({'word': word, 'popularity': avg_score})

            # Get regional interest
            region_df = pytrends.interest_by_region(resolution='COUNTRY', inc_low_vol=True)
            if not region_df.empty:
                region_df = region_df.reset_index()[['geoName', word]]
                region_df = region_df.rename(columns={'geoName': 'Country', word: 'Popularity'})
                region_df['Slang'] = word
                country_data = pd.concat([country_data, region_df])

        except Exception as e:
            print(f"Error fetching {word}: {e}")

    # Sort by overall popularity
    trend_data.sort(key=lambda x: x['popularity'], reverse=True)

    # Build the map visualization if data exists
    map_html = None
    if not country_data.empty:
        fig = px.choropleth(
            country_data,
            locations='Country',
            locationmode='country names',
            color='Popularity',
            hover_name='Country',
            animation_frame='Slang',
            title='Slang Popularity by Country (Google Trends)',
            color_continuous_scale='blues'
        )
        map_html = fig.to_html(full_html=False)

    return render_template('trends.html', trends=trend_data, map_html=map_html)


if __name__ == '__main__':
    app.run(debug=True)

