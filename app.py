from flask import Flask, render_template, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
#test
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dictionary.db'
db = SQLAlchemy(app)

class Word(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    word = db.Column(db.String(50), nullable=False)
    definition = db.Column(db.String(200))
    examples = db.Column(db.String(500))

with app.app_context():
    db.create_all()

@app.route('/')
def index():
    words = Word.query.all()
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

if __name__ == '__main__':
    app.run(debug=True)
