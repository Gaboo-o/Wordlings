# app/utils/give_admin.py
import sys
from app import create_app, db
from app.models import User

def make_admin(username: str):
    app = create_app()
    with app.app_context():
        u = User.query.filter_by(username=username).first()
        if not u:
            print(f"User '{username}' not found.")
            sys.exit(1)
        if u.is_admin:
            print(f"{u.username} is already an admin.")
            return
        u.is_admin = True
        db.session.commit()
        print(f"✅ {u.username} is now an admin.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m app.utils.give_admin <username>")
        sys.exit(2)
    make_admin(sys.argv[1])