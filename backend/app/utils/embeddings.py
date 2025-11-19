# backend/app/utils/embeddings.py
import os
import threading
import numpy as np
from joblib import dump, load

_MODEL = None
_MODEL_LOCK = threading.Lock()
_CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "cache")
os.makedirs(_CACHE_DIR, exist_ok=True)
_EMB_CACHE = os.path.join(_CACHE_DIR, "embeddings.joblib")

def _try_load_model():
    global _MODEL
    with _MODEL_LOCK:
        if _MODEL is None:
            try:
                from sentence_transformers import SentenceTransformer
                _MODEL = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
            except Exception as e:
                _MODEL = None
        return _MODEL

def embed_texts(texts):
    """
    Returns a (n, d) numpy array of embeddings.
    Falls back to TF-IDF if transformer model isn’t available.
    """
    model = _try_load_model()
    if model:
        vecs = np.array(model.encode(texts, batch_size=32, show_progress_bar=False, normalize_embeddings=True))
        return vecs

    # Fallback: TF-IDF + L2 normalize
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.preprocessing import normalize
    tfidf = TfidfVectorizer(min_df=1, ngram_range=(1,2))
    X = tfidf.fit_transform(texts)
    X = normalize(X)
    return X.toarray()

def cosine_sim(A, b):
    """
    A: (n, d) matrix, b: (d,)
    all vectors are assumed L2-normalized (our model returns normalized).
    """
    return A @ b

def save_cache(payload):
    dump(payload, _EMB_CACHE)

def load_cache():
    if os.path.exists(_EMB_CACHE):
        try:
            return load(_EMB_CACHE)
        except Exception:
            return None
    return None


def invalidate_cache():
    if os.path.exists(_EMB_CACHE):
        try:
            os.remove(_EMB_CACHE)
        except Exception:
            pass