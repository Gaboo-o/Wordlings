def validate_word_payload(data):
    word = (data.get("word") or "").strip()
    definition = (data.get("definition") or "").strip()
    examples = (data.get("examples") or "").strip()

    if not word:
        return None, "Word is required"
    if len(word) > 50:
        return None, "Word too long (max 50 chars)"
    if len(definition) > 200:
        return None, "Definition too long (max 200 chars)"
    if len(examples) > 500:
        return None, "Examples too long (max 500 chars)"

    return {
        "word": word,
        "definition": definition,
        "examples": examples
    }, None