from flask import Blueprint, jsonify
from pytrends.request import TrendReq
from app import limiter

trends_bp = Blueprint('trends', __name__)
pytrends = TrendReq(hl='en-US', tz=360, timeout=(5, 10))

@trends_bp.route('/<word>', methods=['GET'])
@limiter.limit("60/minute")     # analytics calls can spike but still cap
def get_trend(word):
    try:
        pytrends = TrendReq(hl='en-US', tz=360)
        kw_list = [word]

        # Fetch interest over time (last 5 years)
        pytrends.build_payload(kw_list, cat=0, timeframe='today 5-y', geo='', gprop='')

        # Interest over time
        data = pytrends.interest_over_time()
        if data.empty:
            return jsonify({"trend": [], "topRegion": None})

        trend_data = [
            {"date": date.strftime("%Y-%m"), "value": int(row[word])}
            for date, row in data.iterrows()
        ]

        # Get region data (interest by country)
        region_data = pytrends.interest_by_region(resolution='COUNTRY', inc_low_vol=True)
        top_region = (
            region_data[word].idxmax()
            if not region_data.empty and word in region_data
            else None
        )

        return jsonify({"trend": trend_data, "topRegion": top_region})

    except Exception as e:
    # Don't 500 the app if Trends is unavailable; return empty data.
        print("Error fetching Google Trends data:", e)
        return jsonify({"trend": [], "topRegion": None, "trendError": str(e)}), 200
