"""
Step 2: Send a Slack message using Composio + OpenAI.

Make sure you've already run 1_connect_whatsapp.py to authenticate first.
"""

import os
from dotenv import load_dotenv
from openai import OpenAI
from composio import Composio
from composio_openai import OpenAIProvider

load_dotenv()

COMPOSIO_API_KEY = os.getenv("COMPOSIO_API_KEY")
USER_ID = "slack-test-user"

composio = Composio(api_key=COMPOSIO_API_KEY, provider=OpenAIProvider())
openai_client = OpenAI()


def send_slack_message(prompt: str):
    """Use an LLM agent to send a Slack message via Composio tools."""

    tools = composio.tools.get(
        user_id=USER_ID,
        tools=["SLACKBOT_SEND_MESSAGE"],
    )

    print(f"Available tools: {[t.get('function', {}).get('name', t) for t in tools]}")

    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        tools=tools,
        messages=[
            {
                "role": "system",
                "content": "You are a helpful assistant that sends Slack messages using the tools provided.",
            },
            {"role": "user", "content": prompt},
        ],
    )

    result = composio.provider.handle_tool_calls(response=response, user_id=USER_ID)
    print(f"\nResult: {result}")
    return result


if __name__ == "__main__":
    channel = input("Slack channel (e.g. #general): ").strip()
    message = input("Message to send: ").strip()

    prompt = f"Send a Slack message to the channel '{channel}' with the text: '{message}'"
    print(f"\nSending message...")
    send_slack_message(prompt)
