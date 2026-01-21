# backend/seed.py
import csv, json, os, sys
from datetime import datetime, timezone
from app import create_app, db
from app.models import Word
from sqlalchemy import func

def upsert_word(row):
    word_text = (row.get("word") or "").strip()
    if not word_text:
        return

    w = Word.query.filter(func.lower(Word.word) == word_text.lower()).first()
    if w is None:
        w = Word(
            word=word_text,
            definition=(row.get("definition") or "").strip(),
            examples=(row.get("examples") or "").strip(),
            status=(row.get("status") or "approved").strip(),
            upvotes=int(row.get("upvotes") or 0),
            created_at=datetime.now(timezone.utc)
        )
        db.session.add(w)
    else:
        # update existing (optional)
        w.definition = (row.get("definition") or w.definition or "").strip()
        w.examples   = (row.get("examples") or w.examples or "").strip()
        if "status" in row:  w.status = (row["status"] or w.status or "approved").strip()
        if "upvotes" in row: w.upvotes = int(row["upvotes"] or w.upvotes or 0)

def seed_from_csv(path):
    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            upsert_word(row)
    db.session.commit()

def seed_from_json(path):
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
        assert isinstance(data, list), "JSON must be a list of objects"
        for row in data:
            upsert_word(row)
    db.session.commit()

if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        if len(sys.argv) < 3:
            print("Usage:")
            print("  python backend/seed.py csv backend/seed_words.csv")
            print("  python backend/seed.py json backend/seed_words.json")
            sys.exit(1)

        kind, path = sys.argv[1], sys.argv[2]
        if not os.path.exists(path):
            print(f"File not found: {path}")
            sys.exit(1)

        if kind.lower() == "csv":
            seed_from_csv(path)
        elif kind.lower() == "json":
            seed_from_json(path)
        else:
            print("First arg must be 'csv' or 'json'")
            sys.exit(1)

        print("✅ Seeding complete.")
