from flask import Blueprint, request, jsonify
from joblib import load
from pytrends.request import TrendReq
import numpy as np
import pandas as pd
from app.models import Word

ml_bp = Blueprint("ml", __name__)

def fetch_trends_series(pytrends, term):
    pytrends.build_payload([term], timeframe='today 5-y', geo='', gprop='')
    df = pytrends.interest_over_time()
    if df is None or df.empty or term not in df.columns:
        return pd.DataFrame(columns=["date","value"])
    out = df[[term]].reset_index().rename(columns={term:"value","date":"date"})
    return out

def trend_features(series_df: pd.DataFrame):
    if series_df.empty:
        return {
            "trend_mean": 0.0, "trend_max": 0.0, "trend_std": 0.0,
            "trend_last": 0.0, "trend_slope6m": 0.0, "trend_ratio_recent_prev": 1.0
        }
    s = series_df.copy()
    s["date"] = pd.to_datetime(s["date"]); s = s.sort_values("date")
    s["t"] = (s["date"] - s["date"].min()).dt.days
    cutoff = s["date"].max() - pd.DateOffset(months=6)
    s6 = s[s["date"] >= cutoff]
    def slope(df):
        if len(df) < 2: return 0.0
        x = df["t"].to_numpy(float); y = df["value"].to_numpy(float)
        x = x - x.mean(); denom = (x**2).sum() or 1.0
        return float((x*y).sum()/denom)
    recent_cut = s["date"].max() - pd.DateOffset(months=3)
    prev_cut   = s["date"].max() - pd.DateOffset(months=6)
    recent = s[s["date"] > recent_cut]["value"].mean() if any(s["date"] > recent_cut) else 0.0
    prev = s[(s["date"] > prev_cut) & (s["date"] <= recent_cut)]["value"].mean() if any((s["date"] > prev_cut) & (s["date"] <= recent_cut)) else 0.0
    ratio = (recent/prev) if prev > 0 else (recent/1.0)
    return {
        "trend_mean": float(s["value"].mean()),
        "trend_max":  float(s["value"].max()),
        "trend_std":  float(s["value"].std() or 0.0),
        "trend_last": float(s["value"].iloc[-1]),
        "trend_slope6m": slope(s6),
        "trend_ratio_recent_prev": float(ratio),
    }

@ml_bp.route('/predict', methods=['GET'])
def predict():
    model = current_app.config.get("MODEL")
    if model is None:
        return jsonify({"error":"Model not loaded. Train first."}), 500

    word_id = request.args.get("word_id", type=int)
    raw_word = request.args.get("word", type=str)

    if word_id:
        w = Word.query.get(word_id)
        if not w: return jsonify({"error":"Word not found"}), 404
        text = f"{w.word} {w.definition or ''} {w.examples or ''}"
        upvotes = int(w.upvotes or 0)
        age_days = 0
        try:
            age_days = max(0, (pd.Timestamp.utcnow() - pd.to_datetime(w.created_at)).days)
        except Exception:
            pass
        term = w.word
    elif raw_word:
        text = raw_word
        upvotes = 0
        age_days = 0
        term = raw_word
    else:
        return jsonify({"error":"Provide word_id or word"}), 400

    pytrends = TrendReq(hl='en-US', tz=360, timeout=(5,10))
    series = fetch_trends_series(pytrends, term)
    f = trend_features(series)

    row = {
        **f,
        "upvotes": upvotes,
        "age_days": age_days,
        "word_len": len(term),
        "def_len": len(text) - len(term),
        "text": text
    }
    X = pd.DataFrame([row])
    prob = float(model.predict_proba(X)[0,1])
    label = "trending" if prob >= 0.5 else "niche"
    return jsonify({
        "word": term,
        "prob_trending": prob,
        "label": label,
        "features": f
    })
