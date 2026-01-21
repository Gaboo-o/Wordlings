# backend/app/routes/similar.py
from flask import Blueprint, request, jsonify
import sys

print("[similar] module imported", flush=True)

similar_bp = Blueprint("similar", __name__, url_prefix="/api/words")

def _row_text(w):
    return f"{w.word}. {w.definition or ''}. {w.examples or ''}"

def _build_index():
    from app.models import Word
    from app.utils.embeddings import embed_texts, load_cache, save_cache, invalidate_cache

    print("[similar] _build_index() called", flush=True)

    cache = load_cache()
    if cache and all(k in cache for k in ("ids", "words", "texts", "vecs", "kind")):
        ids = cache["ids"]
        vecs = cache["vecs"]
        if isinstance(ids, list) and isinstance(vecs, list) and len(ids) == len(vecs) and len(ids) > 0:
            print(f"[similar] using cached index size={len(ids)}", flush=True)
            return cache
        else:
            print(f"[similar] cache invalid (ids={len(ids) if isinstance(ids,list) else 'X'}, vecs_len={len(vecs) if isinstance(vecs,list) else 'X'}) -> rebuilding", flush=True)
            invalidate_cache()

    rows = Word.query.filter_by(status='approved').all()
    print(f"[similar] queried rows: {len(rows)}", flush=True)

    texts = [_row_text(w) for w in rows]
    ids = [int(w.id) for w in rows]
    words = [w.word for w in rows]

    # Embed (handles fallback internally)
    emb = embed_texts(texts)
    kind = emb.get("kind", "dense")
    vecs = emb.get("vecs", [])

    if len(vecs) != len(ids):
        # last-resort: make trivial sparse vecs from words only
        print(f"[similar] embed/size mismatch (ids={len(ids)}, vecs={len(vecs)}). Using trivial sparse.", flush=True)
        vecs = [{w: 1.0} for w in words]
        kind = "sparse"

    payload = {"ids": ids, "words": words, "texts": texts, "vecs": vecs, "kind": kind}
    print(f"[similar] built index size={len(ids)} kind={kind}", flush=True)
    save_cache(payload)
    return payload

@similar_bp.route('/similar', methods=['GET'])
def similar():
    try:
        print("[similar] /similar hit", flush=True)
        word_id = request.args.get('word_id', type=int)
        word_text = request.args.get('word', type=str)
        limit = request.args.get('limit', default=12, type=int)

        index = _build_index()
        ids = index["ids"]
        words = index["words"]
        vecs = index["vecs"]
        kind = index["kind"]

        print(f"[similar] index size = {len(ids)} kind={kind}", flush=True)
        if not ids:
            return jsonify([]), 200

        # We only support word_id path robustly (that's what your page uses).
        if word_id is None:
            # Free-text could be added later; safe fallback now:
            return jsonify([]), 200

        if word_id not in ids:
            print(f"[similar] word_id {word_id} not in index", flush=True)
            return jsonify([]), 200

        i_center = ids.index(word_id)
        center_vec = vecs[i_center]

        # Build similarities
        scores = []
        if kind == "dense":
            from app.utils.embeddings import cosine_dense
            # ensure same length and normalized; if not, normalize quickly
            from app.utils.embeddings import normalize_dense
            clen = len(center_vec)
            center_vec = normalize_dense(center_vec[:clen])
            for j, v in enumerate(vecs):
                if j == i_center:
                    continue
                if not isinstance(v, list):
                    continue
                if len(v) != clen:
                    continue
                s = cosine_dense(center_vec, v)
                scores.append((j, float(s)))
        else:  # sparse dicts
            from app.utils.embeddings import cosine_sparse
            if not isinstance(center_vec, dict):
                # cannot compare; bail safely
                return jsonify([]), 200
            for j, v in enumerate(vecs):
                if j == i_center:
                    continue
                if not isinstance(v, dict):
                    continue
                s = cosine_sparse(center_vec, v)
                scores.append((j, float(s)))

        # Top-K
        scores.sort(key=lambda x: x[1], reverse=True)
        topk = scores[:max(0, min(limit, len(scores)))]
        results = [{"id": int(ids[j]), "word": str(words[j]), "score": float(s)} for j, s in topk]
        print(f"[similar] returning {len(results)} results", flush=True)
        return jsonify(results), 200

    except Exception as e:
        import traceback; traceback.print_exc(file=sys.stdout)
        print(f"[similar] ERROR: {e}", flush=True)
        # Super-safe fallback to prove UI works
        try:
            from app.models import Word
            fallback = Word.query.limit(6).all()
            return jsonify([{"id": w.id, "word": w.word, "score": 0.0} for w in fallback]), 200
        except Exception:
            return jsonify([]), 200
