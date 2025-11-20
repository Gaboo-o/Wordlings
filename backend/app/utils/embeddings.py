# backend/app/utils/embeddings.py
import os
import json
import math
import threading

# Cache file on disk
_CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "cache")
os.makedirs(_CACHE_DIR, exist_ok=True)
_EMB_CACHE = os.path.join(_CACHE_DIR, "embeddings.joblib")  # we store JSON; name kept for compatibility

# Optional global model
_MODEL = None
_MODEL_LOCK = threading.Lock()

def _try_load_transformer():
    """Try to load sentence-transformers. Return model or None."""
    global _MODEL
    with _MODEL_LOCK:
        if _MODEL is not None:
            return _MODEL
        try:
            from sentence_transformers import SentenceTransformer
            print("[emb] loading transformer model...", flush=True)
            _MODEL = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
            print("[emb] transformer loaded", flush=True)
        except Exception as e:
            print(f"[emb] transformer load failed: {e}", flush=True)
            _MODEL = None
        return _MODEL

def _norm_dense(vec):
    s = sum(x*x for x in vec) ** 0.5 or 1.0
    return [x/s for x in vec]

def _cos_dense(a, b):
    # both lists of equal length, already normalized ideally
    return sum(x*y for x, y in zip(a, b))

def _tokenize(text):
    return [t for t in ''.join(ch.lower() if ch.isalnum() else ' ' for ch in (text or '')).split() if t]

def _tfidf_sparse(texts):
    """Return (list_of_sparse_vecs, 'sparse', corpus_meta) where each vec is {token: weight} normalized."""
    N = len(texts)
    toks_per_doc = [_tokenize(t) for t in texts]
    df = {}
    for toks in toks_per_doc:
        for tok in set(toks):
            df[tok] = df.get(tok, 0) + 1
    idf = {tok: math.log((1 + N) / (1 + c)) + 1.0 for tok, c in df.items()}
    vecs = []
    for toks in toks_per_doc:
        tf = {}
        for tok in toks:
            tf[tok] = tf.get(tok, 0) + 1
        # tf-idf
        w = {tok: tf[tok] * idf.get(tok, 0.0) for tok in tf}
        # L2 normalize
        norm = math.sqrt(sum(v*v for v in w.values())) or 1.0
        w = {k: v/norm for k, v in w.items()}
        vecs.append(w)
    meta = {"idf": idf}  # could use for free-text embedding
    return vecs, "sparse", meta

def _cos_sparse(a, b):
    # a,b are dict token->weight, both normalized
    if not a or not b:
        return 0.0
    # iterate over smaller
    if len(a) > len(b):
        a, b = b, a
    s = 0.0
    for k, va in a.items():
        vb = b.get(k)
        if vb:
            s += va * vb
    return s

def embed_texts(texts):
    """
    Returns a dict: {"vecs": ..., "kind": "dense"|"sparse"}
    - If transformer available, returns dense normalized lists.
    - Else returns normalized sparse dicts via pure-Python TF-IDF.
    Never raises.
    """
    if not texts:
        return {"vecs": [], "kind": "dense"}

    # Try transformer first
    model = _try_load_transformer()
    if model is not None:
        try:
            vecs = model.encode(texts, batch_size=32, normalize_embeddings=True, show_progress_bar=False)
            # Convert to plain Python lists (avoid numpy requirement)
            vecs = [list(map(float, v)) for v in vecs]
            print(f"[emb] transformer embeddings: {len(vecs)} x {len(vecs[0])}", flush=True)
            return {"vecs": vecs, "kind": "dense"}
        except Exception as e:
            print(f"[emb] transformer encode failed: {e}", flush=True)

    # Fallback: pure-python TF-IDF sparse
    vecs, kind, _meta = _tfidf_sparse(texts)
    print(f"[emb] tfidf-sparse embeddings: {len(vecs)} docs", flush=True)
    return {"vecs": vecs, "kind": kind}

def save_cache(payload):
    try:
        with open(_EMB_CACHE, "w", encoding="utf-8") as f:
            json.dump(payload, f)
    except Exception as e:
        print(f"[emb] save_cache failed: {e}", flush=True)

def load_cache():
    if not os.path.exists(_EMB_CACHE):
        return None
    try:
        with open(_EMB_CACHE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[emb] load_cache failed: {e}", flush=True)
        return None

def invalidate_cache():
    try:
        if os.path.exists(_EMB_CACHE):
            os.remove(_EMB_CACHE)
            print("[emb] cache invalidated", flush=True)
    except Exception as e:
        print(f"[emb] cache delete failed: {e}", flush=True)

# Small helpers the route will import
cosine_dense = _cos_dense
cosine_sparse = _cos_sparse
normalize_dense = _norm_dense
