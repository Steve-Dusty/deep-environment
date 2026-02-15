"""
Step 3 (optional): List all available Slack tools/actions in Composio.

Useful to discover what actions are available beyond just sending messages.
"""

import os
from dotenv import load_dotenv
from composio import Composio
from composio_openai import OpenAIProvider

load_dotenv()

COMPOSIO_API_KEY = os.getenv("COMPOSIO_API_KEY")
USER_ID = "slack-test-user"

composio = Composio(api_key=COMPOSIO_API_KEY, provider=OpenAIProvider())


def list_slack_tools():
    """List all Slack tools available through Composio."""
    tools = composio.tools.get(
        user_id=USER_ID,
        toolkits=["SLACKBOT"],
    )

    print(f"Found {len(tools)} Slack tools:\n")
    for tool in tools:
        func = tool.get("function", {})
        name = func.get("name", "unknown")
        desc = func.get("description", "No description")
        print(f"  - {name}")
        print(f"    {desc[:100]}...")
        print()


if __name__ == "__main__":
    list_slack_tools()
