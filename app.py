from flask import Flask, send_from_directory, jsonify
import os
import json

app = Flask(__name__)

CONTENT_DIR = os.path.join(os.path.dirname(__file__), "content")


@app.route("/")
def index():
    return jsonify({
        "name": "HARMONIC Marketing",
        "description": "マーケティングツール・コンテンツ管理",
        "endpoints": {
            "/api/catalog": "YouTube動画カタログ",
            "/api/content-index": "コンテンツ一覧",
        },
    })


@app.route("/api/catalog")
def catalog():
    catalog_path = os.path.join(CONTENT_DIR, "youtube", "catalog.json")
    if os.path.exists(catalog_path):
        with open(catalog_path, "r", encoding="utf-8") as f:
            return jsonify(json.load(f))
    return jsonify({"videos": []})


@app.route("/api/content-index")
def content_index():
    index_path = os.path.join(CONTENT_DIR, "CONTENT-INDEX.md")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return f.read(), 200, {"Content-Type": "text/markdown; charset=utf-8"}
    return "No content index found", 404
