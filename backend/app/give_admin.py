from app import db
from app.models import User

# Find your user
u = User.query.filter_by(username="Gabe").first()
u.is_admin = True
db.session.commit()
print(u.username, "is now admin ✅")
