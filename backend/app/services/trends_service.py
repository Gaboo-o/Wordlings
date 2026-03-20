from pytrends.request import TrendReq
import pandas as pd

def fetch_trends(term):
    pytrends = TrendReq(hl='en-US', tz=360, timeout=(5, 10))
    pytrends.build_payload([term], timeframe='today 5-y', geo='', gprop='')
    df = pytrends.interest_over_time()

    if df is None or df.empty or term not in df.columns:
        return [], None

    trend_data = [
        {"date": date.strftime("%Y-%m"), "value": int(row[term])}
        for date, row in df.iterrows()
    ]

    region_data = pytrends.interest_by_region(resolution='COUNTRY', inc_low_vol=True)
    top_region = (
        region_data[term].idxmax()
        if not region_data.empty and term in region_data
        else None
    )

    return trend_data, top_region