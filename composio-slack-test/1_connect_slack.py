"""
Step 1: Connect your Slack workspace to Composio.

Before running this:
1. Go to https://app.composio.dev/apps/slackbot
2. Create an Auth Config for Slack (OAuth2)
3. Copy the auth config ID (starts with "ac_")
4. Replace the placeholder below with your auth config ID
"""

import os
from dotenv import load_dotenv
from composio import Composio

load_dotenv()

COMPOSIO_API_KEY = os.getenv("COMPOSIO_API_KEY")
AUTH_CONFIG_ID = os.getenv("COMPOSIO_AUTH_CONFIG_ID", "")  # Your auth config ID
USER_ID = "slack-test-user"

composio = Composio(api_key=COMPOSIO_API_KEY)


def connect_slack():
    """Connect via OAuth2 — opens a browser URL for you to authenticate."""
    connection_request = composio.connected_accounts.initiate(
        user_id=USER_ID,
        auth_config_id=AUTH_CONFIG_ID,
        allow_multiple=True,
    )

    print(f"Visit this URL to authenticate Slack:\n{connection_request.redirect_url}")
    print("\nWaiting for you to complete the auth flow...")

    connection_request.wait_for_connection(timeout=120)
    print(f"Connected! Connection ID: {connection_request.id}")
    return connection_request.id


if __name__ == "__main__":
    print("Slack Connection Setup")
    print("=" * 40)
    connect_slack()
