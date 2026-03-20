from flask import Blueprint
from app.services.trends_service import fetch_trends
from app.utils.responses import success, error
from app import limiter

trends_bp = Blueprint('trends', __name__)

@trends_bp.route('/<word>', methods=['GET'])
@limiter.limit("60/minute")
def get_trend(word):
    try:
        trend_data, top_region = fetch_trends(word)
        return success({
            "trend": trend_data,
            "topRegion": top_region
        })
    except Exception:
        return error("Failed to fetch trends", 500)