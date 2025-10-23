from app import db
from datetime import datetime, UTC
from werkzeug.security import generate_password_hash, check_password_hash

class Word(db.Model):
    __tablename__ = 'word'

    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.now(UTC))

    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    submitted_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

    word = db.Column(db.String(50), nullable=False)
    definition = db.Column(db.String(200))
    examples = db.Column(db.String(500))

    upvotes = db.Column(db.Integer, default=0)

    trend_score = db.Column(db.Integer, default=0)
    trend_country = db.Column(db.String(100))

    def to_dict(self):
        return {
            "id": self.id,
            "created_at": self.created_at,
            "status": self.status,
            "submitted_by": self.submitted_by,
            "word": self.word,
            "definition": self.definition,
            "examples": self.examples,
            "upvotes": self.upvotes,
            "trend_score": self.trend_score,
            "trend_country": self.trend_country
        }

class User(db.Model):
    __tablename__ = 'user';

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    password_hash = db.Column(db.String(128))
    is_admin = db.Column(db.Boolean, default=False)
    
    submissions = db.relationship('Word', backref='author', lazy='dynamic')
    upvotes = db.relationship('Upvote', backref='voter', lazy='dynamic')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'is_admin': self.is_admin
        }

class Upvote(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), index=True)
    word_id = db.Column(db.Integer, db.ForeignKey('word.id'), index=True)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.now(UTC))
    
    # user can only vote on a word once
    __table_args__ = (db.UniqueConstraint('user_id', 'word_id', name='_user_word_uc'),)

    def __repr__(self):
        return f'<Upvote User {self.user_id} on Word {self.word_id}>'
