from flask import jsonify

def success(data=None, status=200):
    payload = {
        "success": True,
        "data": data
    }
    return jsonify(payload), status


def error(message, status=400, code=None):
    payload = {
        "success": False,
        "error": {
            "message": message,
            "code": code or status
        }
    }
    return jsonify(payload), status