# backend/app/routes/similar.py
from flask import Blueprint, request, jsonify
from sqlalchemy import func
import numpy as np
import pandas as pd
from app.models import Word
from app import db
from app.utils.embeddings import embed_texts, cosine_sim, load_cache, save_cache

similar_bp = Blueprint("similar", __name__, url_prefix="/api/words")

def _row_text(w):
    # What the model “sees”. Tweak as you like.
    return f"{w.word}. {w.definition or ''}. {w.examples or ''}"

def _build_index():
    # Build an index of {id, word, text, vector}. Cache for speed.
    cache = load_cache()
    if cache and "ids" in cache and "vecs" in cache and "texts" in cache and "words" in cache:
        return cache

    rows = Word.query.filter_by(status='approved').all()
    if not rows:
        payload = {"ids": [], "words": [], "texts": [], "vecs": np.zeros((0, 384), dtype=float)}
        save_cache(payload)
        return payload

    texts = [_row_text(w) for w in rows]
    vecs = embed_texts(texts)  # (n, d)
    payload = {
        "ids": [w.id for w in rows],
        "words": [w.word for w in rows],
        "texts": texts,
        "vecs": vecs
    }
    save_cache(payload)
    return payload

@similar_bp.route('/similar', methods=['GET'])
def similar():
    word_id = request.args.get('word_id', type=int)
    word_text = request.args.get('word', type=str)
    limit = request.args.get('limit', default=12, type=int)

    if not word_id and not word_text:
        return jsonify({"error": "Provide word_id or word"}), 400

    index = _build_index()
    ids = index["ids"]; words = index["words"]; texts = index["texts"]; vecs = index["vecs"]

    if len(ids) == 0:
        return jsonify([]), 200

    if word_id:
        try:
            i_center = ids.index(word_id)
            center_vec = vecs[i_center]
        except ValueError:
            return jsonify({"error":"Word not found or not approved"}), 404
        mask = np.ones(len(ids), dtype=bool); mask[i_center] = False
        sims = cosine_sim(vecs[mask], center_vec)
        filtered_ids = np.array(ids)[mask]
        filtered_words = np.array(words)[mask]
    else:
        # Free text query (not in DB)
        center_vec = embed_texts([word_text])[0]
        sims = cosine_sim(vecs, center_vec)
        filtered_ids = np.array(ids)
        filtered_words = np.array(words)

    topk = min(limit, sims.shape[0])
    if topk == 0:
        return jsonify([]), 200

    idx = np.argpartition(-sims, topk-1)[:topk]
    # sort those by score desc
    idx = idx[np.argsort(-sims[idx])]

    results = []
    for j in idx:
        results.append({
            "id": int(filtered_ids[j]),
            "word": str(filtered_words[j]),
            "score": float(sims[j])
        })
    return jsonify(results), 200
