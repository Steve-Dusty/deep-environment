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
os.makedirs(UPLOADS_DIR, exist_ok=True)

composio = Composio(api_key=COMPOSIO_API_KEY, provider=OpenAIProvider())
openai_client = OpenAI()


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


def get_ai_response(user_message: str, channel: str, image_data: list[bytes] | None = None) -> str:
    """Send message to OpenAI and get a response. Optionally include images."""
    if channel not in conversations:
        conversations[channel] = [
            {
                "role": "system",
                "content": "You are a helpful Slack bot assistant. Keep responses concise and friendly. "
                "You can handle links, questions, images, and general conversation. "
                "When you receive an image, describe what you see and respond helpfully.",
            }
        ]

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
    Returns (image_bytes, mimetype) if successful, else None."""
    if not SLACK_BOT_TOKEN:
        print("Warning: SLACK_BOT_TOKEN not set, cannot download files")
        return None

    file_id = file_info.get("id")
    filename = file_info.get("name", "unknown")
    mimetype = file_info.get("mimetype", "")

    if not mimetype.startswith("image/"):
        print(f"Skipping non-image file: {filename} ({mimetype})")
        return None

    headers = {"Authorization": f"Bearer {SLACK_BOT_TOKEN}"}

    # Always fetch the download URL from Slack API (trigger payload URLs can be unreliable)
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

    # Fallback to trigger payload URLs
    if not url:
        url = file_info.get("url_private_download") or file_info.get("url_private")

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
    return (resp.content, mimetype)


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
        if files:
            for file_info in files:
                result = download_slack_file(file_info, user, channel)
                if result:
                    raw_bytes, _ = result
                    png_bytes = convert_image_to_png(raw_bytes)
                    if png_bytes:
                        image_data.append(png_bytes)

        if not channel:
            return

        # Skip if there's nothing to process (no text and no images)
        if not text and not image_data:
            return

        print(f"[#{channel}] User {user}: {text or '[image upload]'}")

        # Get AI response (with images if present)
        ai_response = get_ai_response(text, channel, image_data=image_data if image_data else None)
        print(f"[#{channel}] Bot: {ai_response}\n")

        # Send reply
        send_slack_reply(channel, ai_response)

    subscription.wait_forever()


if __name__ == "__main__":
    main()
