"""
Slack Conversational Bot — listens for messages, responds with OpenAI.

Before running this, you need to configure your Slack app:

1. Go to https://api.slack.com/apps > Your App > Event Subscriptions
2. Toggle "Enable Events" ON
3. Set Request URL to:
   https://backend.composio.dev/api/v3/trigger_instances/slack/default/handle
4. Under "Subscribe to bot events", add:
   - message.channels
   - message.im
5. Save Changes
6. Go to "OAuth & Permissions" and make sure these Bot Token Scopes exist:
   - chat:write
   - channels:history
   - im:history
   - channels:read
7. Reinstall the app to your workspace if you added new scopes
"""

import io
import os
import json
import time
import base64
import random
import requests
from PIL import Image
from dotenv import load_dotenv
from openai import OpenAI
from composio import Composio
from composio_openai import OpenAIProvider

load_dotenv()

COMPOSIO_API_KEY = os.getenv("COMPOSIO_API_KEY")
SLACK_BOT_TOKEN = os.getenv("SLACK_BOT_TOKEN")
USER_ID = "slack-test-user"

UPLOADS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
METADATA_FILE = os.path.join(UPLOADS_DIR, "metadata.json")
ENV_CONTEXT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "env_context.json")
os.makedirs(UPLOADS_DIR, exist_ok=True)

composio = Composio(api_key=COMPOSIO_API_KEY, provider=OpenAIProvider())
openai_client = OpenAI()


def load_env_context():
    """Load the environmental monitoring context for the AI system prompt."""
    if not os.path.exists(ENV_CONTEXT_FILE):
        return ""
    with open(ENV_CONTEXT_FILE, "r") as f:
        data = json.load(f)

    lines = []
    lines.append("=== DEEP ENVIRONMENT — Active Environmental Threat Reports ===\n")

    # Summarize regions
    kg = data.get("knowledge_graph", {})
    for r in kg.get("regions", []):
        lines.append(f"REGION: {r['name']} | Threat: {r['threat_level'].upper()} | Health: {r['health_score']}/100 | {r['key_metric']}")
    lines.append("")

    # Cross-region correlations
    for c in kg.get("correlations", []):
        lines.append(f"  CORRELATION: {c}")
    lines.append("")

    # Full pin reports
    for loc in data.get("locations", []):
        lines.append(f"--- [{loc['severity'].upper()}] {loc['title']} ---")
        lines.append(f"  Location: {loc['city']}, {loc['state']} ({loc['neighborhood']})")
        lines.append(f"  Category: {loc['category']} | Confidence: {loc['confidence']}% | Agents: {loc['agents_active']}")
        lines.append(f"  Summary: {loc['summary']}")
        for k, v in loc.get("metrics", {}).items():
            lines.append(f"  Metric — {k}: {v}")
        lines.append(f"  Impact: {loc['impact']}")
        corr = loc.get("correlated_with", [])
        if corr:
            lines.append(f"  Correlated with: {', '.join(corr)}")
        lines.append("")

    return "\n".join(lines)


ENV_CONTEXT = load_env_context()
if ENV_CONTEXT:
    print(f"Loaded environmental context ({len(ENV_CONTEXT)} chars)")
else:
    print("Warning: No environmental context found (env_context.json missing)")


def convert_image_to_png(img_bytes):
    """Convert any image bytes to PNG. Returns PNG bytes or None on failure."""
    try:
        img = Image.open(io.BytesIO(img_bytes))
        buf = io.BytesIO()
        img.convert("RGB").save(buf, format="PNG")
        return buf.getvalue()
    except Exception as e:
        print(f"Failed to convert image: {e}")
        return None

# Conversation history per channel
conversations = {}

# Pending images waiting for user to provide their city
# {channel: [(png_bytes, timestamp, ai_description), ...]}
pending_location = {}


LOCATION_SUMMARIES_PROMPT = """Available monitoring locations (use these exact IDs):
- loc-sf: SF Bay, San Francisco, CA (37.7955, -122.3912)
- loc-la: LA Basin, Los Angeles, CA (34.0901, -118.2850)
- loc-gulf: Gulf Coast, Houston, TX (29.7580, -95.3562)
- loc-ever: Everglades, Miami, FL (25.8500, -80.8320)
- loc-pnw: Pacific NW, Seattle, WA (47.6130, -122.3380)
- loc-ny: NY Harbor, New York, NY (40.7128, -74.0060)
- loc-chi: Chicago River, Chicago, IL (41.8781, -87.6298)
- loc-den: Denver Metro, Denver, CO (39.7392, -104.9903)
- loc-phx: Phoenix Valley, Phoenix, AZ (33.4484, -112.0740)
- loc-atl: Atlanta Metro, Atlanta, GA (33.7490, -84.3880)
"""

LOCATION_COORDS = {
    "loc-sf":   (37.7955, -122.3912),
    "loc-la":   (34.0901, -118.2850),
    "loc-gulf": (29.7580, -95.3562),
    "loc-ever": (25.8500, -80.8320),
    "loc-pnw":  (47.6130, -122.3380),
    "loc-ny":   (40.7128, -74.0060),
    "loc-chi":  (41.8781, -87.6298),
    "loc-den":  (39.7392, -104.9903),
    "loc-phx":  (33.4484, -112.0740),
    "loc-atl":  (33.7490, -84.3880),
}


def extract_city_from_text(text):
    """Use AI to check if the user's message contains a city or location.
    Returns the city name string if found, or None."""
    if not text or len(text.strip()) < 2:
        return None
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Extract the city or location name from the user's message. "
                        "Only extract if the user is clearly indicating a city, region, or place name. "
                        "Examples that HAVE a city: 'pollution in Denver', 'I'm in Chicago', 'SF Bay', 'Houston TX'. "
                        "Examples that do NOT: 'check this out', 'what is this', 'looks bad'. "
                        'Return JSON: {"city": "City Name"} if found, or {"city": null} if not.'
                    ),
                },
                {"role": "user", "content": text},
            ],
        )
        result = json.loads(response.choices[0].message.content)
        city = result.get("city")
        if city:
            print(f"  Extracted city from text: {city}")
        return city
    except Exception as e:
        print(f"City extraction failed: {e}")
        return None


def classify_image(image_bytes, ai_description, user_city):
    """Classify an uploaded image for the dashboard knowledge graph.
    user_city is required — the city/location the user reported from.
    Returns a dict with location_id, coordinates, category, severity, etc., or None on failure."""
    try:
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an environmental monitoring classifier. Given an image and its AI description, "
                        "classify it for our environmental dashboard.\n\n"
                        + LOCATION_SUMMARIES_PROMPT + "\n"
                        f'LOCATION: The user reported this from "{user_city}". '
                        "Map their city to the closest monitoring location ID from the list above. "
                        "Do NOT guess location from the image — always use the user-provided city/place.\n\n"
                        "COORDINATES: You must also return the approximate latitude and longitude of the "
                        "specific place the user mentioned. For example:\n"
                        '  - "SFSU" → 37.7219, -122.4782 (San Francisco State University)\n'
                        '  - "Golden Gate Park" → 37.7694, -122.4862\n'
                        '  - "downtown Houston" → 29.7604, -95.3698\n'
                        "Use your knowledge of real-world geography. Be as precise as possible.\n\n"
                        "Respond with a JSON object containing:\n"
                        '- "location_id": one of the location IDs above, mapped from the user\'s city\n'
                        '- "latitude": approximate latitude of the specific place the user mentioned\n'
                        '- "longitude": approximate longitude of the specific place the user mentioned\n'
                        '- "resolved_location": the full name of the place you resolved (e.g. "San Francisco State University, CA")\n'
                        '- "category": one of: pollution, deforestation, runoff, wildfire, litter, erosion, invasive, drought, contamination, other\n'
                        '- "severity": one of: low, moderate, elevated, high, critical\n'
                        '- "problem_name": short name for the environmental problem (2-5 words)\n'
                        '- "problem_description": one sentence describing the environmental issue shown\n'
                        '- "indicators": array of 2-4 specific observable indicators from the image\n'
                        '- "trend": one of: improving, stable, worsening\n'
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": f"Classify this environmental image. Previous AI analysis: {ai_description}",
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/png;base64,{b64}"},
                        },
                    ],
                },
            ],
        )
        result = json.loads(response.choices[0].message.content)
        # Validate required fields (lat/lon no longer required — we have fallback)
        required = ["location_id", "category", "severity", "problem_name", "problem_description", "indicators", "trend"]
        for key in required:
            if key not in result:
                print(f"Classification missing field: {key}")
                return None
        # Coordinate fallback: if lat/lon missing or invalid, use location_id's known coords + jitter
        loc_id = result.get("location_id", "")
        if not result.get("latitude") or not result.get("longitude"):
            if loc_id in LOCATION_COORDS:
                fallback_lat, fallback_lon = LOCATION_COORDS[loc_id]
                result["latitude"] = fallback_lat + random.uniform(-0.005, 0.005)
                result["longitude"] = fallback_lon + random.uniform(-0.005, 0.005)
                print(f"  Used fallback coords for {loc_id} with jitter")
            else:
                print(f"  No coordinates and unknown location_id: {loc_id}")
        elif loc_id in LOCATION_COORDS:
            # If coords match the static pin exactly, add small jitter so they don't overlap
            known_lat, known_lon = LOCATION_COORDS[loc_id]
            if abs(result["latitude"] - known_lat) < 0.001 and abs(result["longitude"] - known_lon) < 0.001:
                result["latitude"] += random.uniform(-0.005, 0.005)
                result["longitude"] += random.uniform(-0.005, 0.005)
        print(f"  Resolved location: {result.get('resolved_location', user_city)} ({result.get('latitude', '?')}, {result.get('longitude', '?')})")
        return result
    except Exception as e:
        print(f"Classification failed: {e}")
        return None


def build_upload_confirmation(classification):
    """Build a clean confirmation message from classification data."""
    loc = classification.get("resolved_location", "Unknown")
    lat = classification.get("latitude", "?")
    lng = classification.get("longitude", "?")
    problem = classification.get("problem_name", "Unknown issue")
    severity = classification.get("severity", "unknown").upper()
    category = classification.get("category", "unknown")
    trend = classification.get("trend", "stable")
    return (
        f"Uploaded from {loc} ({lat}, {lng})\n"
        f"{problem} — {category} | Severity: {severity} | Trend: {trend}"
    )


def save_classification(timestamp, classification, user_city=None):
    """Save the classification result back into the upload metadata."""
    metadata = load_metadata()
    for entry in metadata:
        if entry.get("timestamp") == timestamp:
            entry["classification"] = classification
            if user_city:
                entry["user_city"] = user_city
            break
    save_metadata(metadata)


def build_upload_context():
    """Build a context string from recent image uploads with their AI descriptions."""
    metadata = load_metadata()
    if not metadata:
        return ""
    # Most recent 20 uploads
    recent = sorted(metadata, key=lambda x: x.get("timestamp", 0), reverse=True)[:20]
    lines = ["\n=== RECENT FIELD PHOTO UPLOADS ==="]
    for entry in recent:
        ts = entry.get("timestamp", 0)
        dt = time.strftime("%b %d %I:%M %p", time.localtime(ts))
        desc = entry.get("ai_description", "No analysis yet")
        lines.append(
            f"  [{dt}] {entry.get('original_name', '?')} — "
            f"Channel: {entry.get('channel', '?')} | User: {entry.get('user', '?')}"
        )
        lines.append(f"    AI Analysis: {desc}")
    return "\n".join(lines)


def save_ai_description(timestamp, description):
    """Save the AI's image description back into the upload metadata."""
    metadata = load_metadata()
    for entry in metadata:
        if entry.get("timestamp") == timestamp:
            entry["ai_description"] = description
            break
    save_metadata(metadata)


def build_system_message():
    """Build the full system message with env context + recent uploads."""
    system_content = (
        "You are Deep Environment Bot — an environmental monitoring AI assistant in Slack. "
        "You have access to real-time environmental threat data across US locations. "
        "When users ask about a city, region, or environmental issue, use the data below to give specific, "
        "data-driven answers with actual metrics, severity levels, and impact statements. "
        "Cite specific numbers (e.g. PM2.5, dissolved oxygen, E. coli levels). "
        "If a user sends a photo, analyze it for environmental relevance and connect it to known threats. "
        "Keep responses concise but informative. Use threat levels: low, moderate, elevated, high, critical.\n\n"
    )
    if ENV_CONTEXT:
        system_content += ENV_CONTEXT
    upload_ctx = build_upload_context()
    if upload_ctx:
        system_content += upload_ctx
    return system_content


def get_ai_response(user_message: str, channel: str, image_data: list[bytes] | None = None, image_timestamps: list[int] | None = None) -> str:
    """Send message to OpenAI and get a response. Optionally include images."""
    # Refresh system message every time to pick up new uploads
    system_msg = {"role": "system", "content": build_system_message()}
    if channel not in conversations:
        conversations[channel] = [system_msg]
    else:
        conversations[channel][0] = system_msg

    # Build the user message content
    prompt_text = user_message or "What's in this image?"
    if image_data:
        content = [{"type": "text", "text": prompt_text}]
        for png_bytes in image_data:
            b64 = base64.b64encode(png_bytes).decode("utf-8")
            content.append({
                "type": "image_url",
                "image_url": {"url": f"data:image/png;base64,{b64}"},
            })
        # Send image message but store only text in history to avoid issues
        messages_to_send = conversations[channel] + [{"role": "user", "content": content}]
        conversations[channel].append({"role": "user", "content": f"[Sent image(s)] {prompt_text}"})
    else:
        conversations[channel].append({"role": "user", "content": user_message})
        messages_to_send = conversations[channel]

    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages_to_send,
    )

    assistant_msg = response.choices[0].message.content
    conversations[channel].append({"role": "assistant", "content": assistant_msg})

    # Save the AI description back to upload metadata for future context
    if image_data and image_timestamps:
        for ts in image_timestamps:
            save_ai_description(ts, assistant_msg)

    # Keep history manageable
    if len(conversations[channel]) > 21:
        conversations[channel] = conversations[channel][:1] + conversations[channel][-20:]

    return assistant_msg


def load_metadata():
    """Load the image metadata from disk."""
    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, "r") as f:
            return json.load(f)
    return []


def save_metadata(metadata):
    """Save image metadata to disk."""
    with open(METADATA_FILE, "w") as f:
        json.dump(metadata, f, indent=2)


def download_slack_file(file_info, user, channel):
    """Download a file from Slack and save it locally with metadata.
    Returns (image_bytes, mimetype, timestamp) if successful, else None."""
    if not SLACK_BOT_TOKEN:
        print("Warning: SLACK_BOT_TOKEN not set, cannot download files")
        return None

    file_id = file_info.get("id")
    filename = file_info.get("name", "unknown")
    mimetype = file_info.get("mimetype", "")

    headers = {"Authorization": f"Bearer {SLACK_BOT_TOKEN}"}

    # Always fetch file info from Slack API — trigger payload fields can be missing
    url = None
    if file_id:
        info_resp = requests.get(
            "https://slack.com/api/files.info",
            headers=headers,
            params={"file": file_id},
        )
        if info_resp.status_code == 200:
            data = info_resp.json()
            if data.get("ok"):
                f = data["file"]
                url = f.get("url_private_download") or f.get("url_private")
                # Use API response for name/mimetype if trigger payload was empty
                if not mimetype:
                    mimetype = f.get("mimetype", "")
                if filename == "unknown":
                    filename = f.get("name", "unknown")

    # Fallback to trigger payload URLs
    if not url:
        url = file_info.get("url_private_download") or file_info.get("url_private")

    # Now check mimetype after we've had a chance to get it from the API
    if not mimetype.startswith("image/"):
        print(f"Skipping non-image file: {filename} ({mimetype})")
        return None

    if not url:
        print(f"No download URL found for file: {filename}")
        return None

    print(f"Downloading: {url}")
    resp = requests.get(url, headers=headers)
    if resp.status_code != 200:
        print(f"Failed to download {filename}: HTTP {resp.status_code}")
        return None

    # Verify we got actual image data, not an HTML error page
    if resp.content[:15].lstrip().startswith(b"<!DOCTYPE") or resp.content[:15].lstrip().startswith(b"<html"):
        print(f"Download returned HTML instead of image for {filename}. Token may lack files:read scope.")
        return None

    ts = int(time.time())
    safe_filename = f"{ts}_{filename}"
    filepath = os.path.join(UPLOADS_DIR, safe_filename)

    with open(filepath, "wb") as f:
        f.write(resp.content)

    metadata = load_metadata()
    metadata.append({
        "filename": safe_filename,
        "original_name": filename,
        "user": user,
        "channel": channel,
        "timestamp": ts,
        "mimetype": mimetype,
    })
    save_metadata(metadata)
    print(f"Saved image: {safe_filename}")
    return (resp.content, mimetype, ts)


def send_slack_reply(channel: str, text: str):
    """Send a message back to the Slack channel."""
    result = composio.tools.execute(
        "SLACKBOT_SEND_MESSAGE",
        user_id=USER_ID,
        arguments={"channel": channel, "text": text},
    )
    return result


def main():
    print("Setting up Slack trigger...")

    # Create trigger using the newest active connected account
    trigger = composio.triggers.create(
        slug="SLACKBOT_RECEIVE_MESSAGE",
        connected_account_id=os.getenv("COMPOSIO_CONNECTED_ACCOUNT_ID", ""),
        trigger_config={},
    )
    trigger_id = trigger.trigger_id
    print(f"Trigger created: {trigger_id}")

    print("Bot is running! Listening for Slack messages...")
    print("Press Ctrl+C to stop.\n")

    # Subscribe to events
    subscription = composio.triggers.subscribe()

    @subscription.handle(trigger_id=trigger_id)
    def handle_message(data):
        payload = data.get("payload", data)
        text = payload.get("text", "")
        channel = payload.get("channel", "")
        user = payload.get("user", "")
        bot_id = payload.get("bot_id")
        files = payload.get("files", [])

        # Skip bot's own messages to avoid loops
        if bot_id:
            return

        # Handle file uploads — download, save, and convert for vision
        image_data = []
        image_timestamps = []
        if files:
            for file_info in files:
                result = download_slack_file(file_info, user, channel)
                if result:
                    raw_bytes, _, ts = result
                    png_bytes = convert_image_to_png(raw_bytes)
                    if png_bytes:
                        image_data.append(png_bytes)
                        image_timestamps.append(ts)

        if not channel:
            return

        # Skip if there's nothing to process (no text and no images)
        if not text and not image_data:
            return

        print(f"[#{channel}] User {user}: {text or '[image upload]'}")

        # --- Check if this is a city response to pending images ---
        if text and not image_data and channel in pending_location and pending_location[channel]:
            city = extract_city_from_text(text)
            if city:
                print(f"  City response for pending images: {city}")
                for png_bytes, ts, ai_desc in pending_location[channel]:
                    classification = classify_image(png_bytes, ai_desc, user_city=city)
                    if classification:
                        save_classification(ts, classification, user_city=city)
                        print(f"  Classified → {classification['location_id']} / {classification['category']} / {classification['severity']}")
                        send_slack_reply(channel, build_upload_confirmation(classification))
                del pending_location[channel]
                return
            else:
                # Not a city — process as normal message but remind them
                ai_response = get_ai_response(text, channel)
                print(f"[#{channel}] Bot: {ai_response}\n")
                send_slack_reply(channel, ai_response + "\n\nI still need your city to map the earlier photo. What city are you in?")
                return

        # --- Get AI response internally (used for classification context, not sent to user) ---
        ai_response = get_ai_response(
            text, channel,
            image_data=image_data if image_data else None,
            image_timestamps=image_timestamps if image_timestamps else None,
        )
        print(f"[#{channel}] AI analysis (internal): {ai_response}\n")

        # --- Handle image uploads — need city for classification ---
        if image_data and image_timestamps:
            city = extract_city_from_text(text) if text else None

            if city:
                # User provided city with the image — classify and confirm
                for png_bytes, ts in zip(image_data, image_timestamps):
                    classification = classify_image(png_bytes, ai_response, user_city=city)
                    if classification:
                        save_classification(ts, classification, user_city=city)
                        print(f"  Classified → {classification['location_id']} / {classification['category']} / {classification['severity']}")
                        send_slack_reply(channel, build_upload_confirmation(classification))
            else:
                # No city provided — store pending and ask
                for png_bytes, ts in zip(image_data, image_timestamps):
                    pending_location.setdefault(channel, []).append((png_bytes, ts, ai_response))
                send_slack_reply(channel, "Image received! What city or location are you reporting from?")
        else:
            # Regular text message, no images
            send_slack_reply(channel, ai_response)

    subscription.wait_forever()


if __name__ == "__main__":
    main()
