# backend/train_model.py
import os, math
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, UTC
from joblib import dump
from sqlalchemy import create_engine
from pytrends.request import TrendReq

from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report

DB_URL = os.environ.get("DATABASE_URL", "sqlite:///dictionary.db")

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
    s["date"] = pd.to_datetime(s["date"])
    s = s.sort_values("date")
    s["t"] = (s["date"] - s["date"].min()).dt.days
    # Slope (last 6 months)
    cutoff = s["date"].max() - pd.DateOffset(months=6)
    s6 = s[s["date"] >= cutoff]
    def slope(df):
        if len(df) < 2: return 0.0
        x = df["t"].to_numpy(dtype=float)
        y = df["value"].to_numpy(dtype=float)
        x = (x - x.mean())
        denom = (x**2).sum() or 1.0
        return float((x*y).sum() / denom)
    # recent vs previous 3 months
    recent_cut = s["date"].max() - pd.DateOffset(months=3)
    prev_cut   = s["date"].max() - pd.DateOffset(months=6)
    recent = s[s["date"] > recent_cut]["value"].mean() if any(s["date"] > recent_cut) else 0.0
    prev   = s[(s["date"] > prev_cut) & (s["date"] <= recent_cut)]["value"].mean() if any((s["date"] > prev_cut) & (s["date"] <= recent_cut)) else 0.0
    ratio = (recent / prev) if prev > 0 else (recent / 1.0)

    return {
        "trend_mean": float(s["value"].mean()),
        "trend_max":  float(s["value"].max()),
        "trend_std":  float(s["value"].std() or 0.0),
        "trend_last": float(s["value"].iloc[-1]),
        "trend_slope6m": slope(s6),
        "trend_ratio_recent_prev": float(ratio),
    }

def weak_label_from_signals(feat_row, upvotes):
    trending = (feat_row["trend_slope6m"] > 0 and feat_row["trend_ratio_recent_prev"] >= 1.5) or (upvotes >= 10)
    return 1 if trending else 0

def load_data():
    eng = create_engine(DB_URL)
    words = pd.read_sql("SELECT id, word, definition, examples, upvotes, created_at FROM word WHERE status='approved'", eng)
    return words

def main():
    pytrends = TrendReq(hl='en-US', tz=360, timeout=(5,10))
    df = load_data()
    if df.empty:
        print("No words to train on.")
        return

    feature_rows = []
    for _, row in df.iterrows():
        series = fetch_trends_series(pytrends, row["word"])
        f = trend_features(series)
        text = f"{row.get('word','')} {row.get('definition','') or ''} {row.get('examples','') or ''}"
        up = int(row.get("upvotes") or 0)
        age_days = 0
        try:
            created = pd.to_datetime(row.get("created_at"))
            age_days = max(0, (pd.Timestamp.utcnow() - created).days)
        except Exception:
            pass

        feat = {
            **f,
            "upvotes": up,
            "age_days": age_days,
            "word_len": len(row.get("word","")),
            "def_len": len((row.get("definition") or "")),
            "text": text
        }
        label = weak_label_from_signals(f, up)
        feature_rows.append({**feat, "label": label})

    X = pd.DataFrame(feature_rows)
    y = X.pop("label")

    numeric = ["trend_mean","trend_max","trend_std","trend_last","trend_slope6m",
               "trend_ratio_recent_prev","upvotes","age_days","word_len","def_len"]
    textcol = "text"

    pre = ColumnTransformer([
        ("num", StandardScaler(), numeric),
        ("txt", TfidfVectorizer(min_df=2, ngram_range=(1,2)), textcol)
    ])
    clf = LogisticRegression(max_iter=1000)

    pipe = Pipeline([
        ("prep", pre),
        ("clf", clf)
    ])

    pipe.fit(X, y)
    preds = pipe.predict(X)
    print(classification_report(y, preds, digits=3))

    os.makedirs("backend/models", exist_ok=True)
    dump(pipe, "backend/models/word_trend_clf.joblib")
    print("Saved model to backend/models/word_trend_clf.joblib")

if __name__ == "__main__":
    main()
