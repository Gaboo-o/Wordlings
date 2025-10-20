from .db import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)  # hashed later 
    role = db.Column(db.String(20), default='user')  # 'user' or 'admin'

    words = db.relationship('Word', backref='submitter', lazy=True)

    def is_admin(self):
        return self.role == 'admin'


class Word(db.Model):
    __tablename__ = 'words'

    id = db.Column(db.Integer, primary_key=True)

    word = db.Column(db.String(50), nullable=False)
    definition = db.Column(db.String(200))
    examples = db.Column(db.String(500))
    upvotes = db.Column(db.Integer, default=0)

    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    submitted_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    trend_score = db.Column(db.Integer, default=0)
    trend_country = db.Column(db.String(100))
    trend_last_update = db.Column(db.DateTime, default=None)
