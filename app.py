from flask import Flask, render_template, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from rapidfuzz import fuzz
from pytrends.request import TrendReq
import pandas as pd
import plotly.express as px
from datetime import datetime
from flask import jsonify, session, flash
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config['SECRET_KEY'] = 'temporary_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dictionary.db'
db = SQLAlchemy(app)
pytrends = TrendReq(hl='en-US', tz=360)

class Word(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    word = db.Column(db.String(50), nullable=False)
    definition = db.Column(db.String(200))
    examples = db.Column(db.String(500))
    upvotes = db.Column(db.Integer, default=0)

    status = db.Column(db.String(20), default='pending')
    submitted_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

    # New fields for trends
    trend_score = db.Column(db.Integer, default=0)
    trend_country = db.Column(db.String(100))
    trend_last_update = db.Column(db.DateTime)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

@app.route('/')
def index():
    sort_by = request.args.get('sort', 'alphabetical')
    if sort_by == 'popular':
        words = Word.query.filter_by(status='approved').order_by(Word.upvotes.desc()).all()
    else:
        words = Word.query.filter_by(status='approved').order_by(Word.word.asc()).all()

    return render_template('index.html', words=words)

@app.route('/add', methods=['GET', 'POST'])
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
    trend_score, top_country, trend_chart_html = fetch_trends_for_word(word.word)

    return render_template(
        'words.html',
        word=word,
        trend_score=trend_score,
        top_country=top_country,
        trend_chart_html=trend_chart_html
    )

@app.route('/search')
def search():
    searchTerm = request.args.get('search')
    sort_by = request.args.get('sort', 'alphabetical')  # 'popular' or 'alphabetical'

    # If no search term, redirect to index
    if not searchTerm:
        if sort_by == 'popular':
            words = Word.query.filter_by(status='approved').order_by(Word.upvotes.desc()).all()
        else:
            words = Word.query.filter_by(status='approved').order_by(Word.word.acs()).all()
            return render_template('index.html', words=words)

    # Grab all words from DB
    all_words = Word.query.filter_by(status='approved').all()
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

@app.route('/my-submissions')
def my_submissions():
    current_user = session.get('user_id', 'anonymous')
    submissions = Word.query.filter_by(submitted_by=current_user).all()
    return render_template('my_submissions.html', words=submissions)

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        if request.form.get('password') == 'admin123':  # Temporary password
            session['is_admin'] = True
            return redirect(url_for('review_submissions'))
    return render_template('admin_login.html')

@app.route('/admin/review')
def review_submissions():
    if not session.get('is_admin'):
        return redirect(url_for('admin_login'))
    pending_words = Word.query.filter_by(status='pending').all()
    return render_template('review.html', words=pending_words)

@app.route('/admin/approve/<int:id>', methods=['POST'])
def approve_word(id):
    if not session.get('is_admin'):
        return redirect(url_for('admin_login'))
    word = Word.query.get_or_404(id)
    word.status = 'approved'
    db.session.commit()
    return redirect(url_for('review_submissions'))

@app.route('/admin/reject/<int:id>', methods=['POST'])
def reject_word(id):
    if not session.get('is_admin'):
        return redirect(url_for('admin_login'))
    word = Word.query.get_or_404(id)
    word.status = 'rejected'
    db.session.commit()
    return redirect(url_for('review_submissions'))

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        # Check if username exists
        if User.query.filter_by(username=username).first():
            flash('Username already taken')
            return redirect(url_for('signup'))

        # Create user
        user = User(username=username)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        # Auto-login after signup
        session['user_id'] = user.id
        session['is_admin'] = user.is_admin
        return redirect(url_for('index'))

    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            session['user_id'] = user.id
            session['is_admin'] = user.is_admin
            return redirect(url_for('index'))

        flash('Invalid credentials')
        return redirect(url_for('login'))

    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    session.pop('is_admin', None)
    return redirect(url_for('index'))

@app.route('/upvote/<int:id>', methods=['POST'])
def upvote(id):
    word = Word.query.get_or_404(id)
    word.upvotes += 1
    db.session.commit()

    # Redirect back to where the upvote came from
    referrer = request.referrer or url_for('index')
    return redirect(referrer)

@app.route('/api/upvote/<int:id>', methods=['POST'])
def api_upvote(id):
    word = Word.query.get_or_404(id)
    word.upvotes += 1
    db.session.commit()
    return jsonify({'upvotes': word.upvotes})

def fetch_trends_for_word(word):
    """Fetch and cache Google Trends data for a specific slang word."""

    # Get from DB
    db_word = Word.query.filter_by(word=word).first()
    if not db_word:
        return None

    # Only refresh once every 24 hours
    if db_word.trend_last_update and (datetime.utcnow() - db_word.trend_last_update).total_seconds() < 86400:
        return db_word.trend_score, db_word.trend_country, None  # use cached data

    try:
        pytrends.build_payload([word], cat=0, timeframe='today 3-m', geo='', gprop='')

        # Interest over time
        interest = pytrends.interest_over_time()
        if not interest.empty:
            avg_score = int(interest[word].mean())
        else:
            avg_score = 0

        # Regional interest
        region_df = pytrends.interest_by_region(resolution='COUNTRY', inc_low_vol=True)
        top_country = None
        if not region_df.empty:
            top_country = region_df[word].idxmax()

        # Save to DB
        db_word.trend_score = avg_score
        db_word.trend_country = top_country
        db_word.trend_last_update = datetime.utcnow()
        db.session.commit()

        # Make a graph
        if not interest.empty:
            fig = px.line(interest.reset_index(), x='date', y=word,
                          title=f"Popularity Over Time: {word}",
                          labels={word: "Popularity", "date": "Date"})
            trend_chart_html = fig.to_html(full_html=False)
        else:
            trend_chart_html = None

        return avg_score, top_country, trend_chart_html

    except Exception as e:
        print("Trend fetch error:", e)
        return 0, None, None

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

with app.app_context():
        db.create_all()

if __name__ == '__main__':
    app.run(debug=True)