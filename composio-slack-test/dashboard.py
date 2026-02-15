"""
Slack Image Dashboard — displays images uploaded via the Slack bot.

Run:  python dashboard.py
View: http://localhost:5000
"""

import json
import os
from datetime import datetime

from flask import Flask, send_from_directory

UPLOADS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
METADATA_FILE = os.path.join(UPLOADS_DIR, "metadata.json")
os.makedirs(UPLOADS_DIR, exist_ok=True)

app = Flask(__name__)


def load_metadata():
    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, "r") as f:
            return json.load(f)
    return []


@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOADS_DIR, filename)


@app.route("/")
def index():
    metadata = load_metadata()
    metadata.sort(key=lambda x: x.get("timestamp", 0), reverse=True)

    image_cards = ""
    if not metadata:
        image_cards = '<p class="empty">No images uploaded yet. Upload an image in Slack to see it here!</p>'
    else:
        for entry in metadata:
            ts = entry.get("timestamp", 0)
            dt = datetime.fromtimestamp(ts).strftime("%b %d, %Y  %I:%M %p")
            image_cards += f"""
        <div class="card">
          <img src="/uploads/{entry['filename']}" alt="{entry.get('original_name', '')}" loading="lazy" />
          <div class="card-info">
            <span class="filename">{entry.get('original_name', entry['filename'])}</span>
            <span class="meta">Channel: {entry.get('channel', '?')}  &middot;  User: {entry.get('user', '?')}</span>
            <span class="meta">{dt}</span>
          </div>
        </div>"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="5" />
  <title>Slack Image Dashboard</title>
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #0f0f13;
      color: #e4e4e7;
      min-height: 100vh;
    }}

    header {{
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-bottom: 1px solid #2a2a3e;
      padding: 1.25rem 2rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }}

    header .logo {{
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #e01e5a, #ecb22e, #2eb67d, #36c5f0);
      border-radius: 8px;
    }}

    header h1 {{
      font-size: 1.25rem;
      font-weight: 600;
      color: #f4f4f5;
    }}

    header .badge {{
      margin-left: auto;
      background: #2a2a3e;
      color: #a1a1aa;
      font-size: 0.8rem;
      padding: 0.3rem 0.7rem;
      border-radius: 999px;
    }}

    .container {{
      max-width: 900px;
      margin: 2rem auto;
      padding: 0 1.5rem;
    }}

    .empty {{
      text-align: center;
      color: #71717a;
      font-size: 1.1rem;
      margin-top: 4rem;
    }}

    .card {{
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 1.5rem;
      transition: border-color 0.2s;
    }}

    .card:hover {{
      border-color: #3f3f46;
    }}

    .card img {{
      width: 100%;
      display: block;
      max-height: 600px;
      object-fit: contain;
      background: #09090b;
    }}

    .card-info {{
      padding: 1rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }}

    .filename {{
      font-weight: 600;
      font-size: 0.95rem;
      color: #f4f4f5;
    }}

    .meta {{
      font-size: 0.8rem;
      color: #71717a;
    }}
  </style>
</head>
<body>
  <header>
    <div class="logo"></div>
    <h1>Slack Image Dashboard</h1>
    <span class="badge">{len(metadata)} image{"s" if len(metadata) != 1 else ""}</span>
  </header>
  <div class="container">
    {image_cards}
  </div>
</body>
</html>"""
    return html


if __name__ == "__main__":
    print("Dashboard running at http://localhost:8050")
    app.run(debug=True, port=8050)
