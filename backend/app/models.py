from app import db
from datetime import datetime, UTC

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.now(UTC))

    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default='user')  # 'user' or 'admin'

    words = db.relationship('Word', backref='submitter', lazy=True)

    def is_admin(self):
        return self.role == 'admin'


class Word(db.Model):
    __tablename__ = 'words'

    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.now(UTC))

    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    submitted_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

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

