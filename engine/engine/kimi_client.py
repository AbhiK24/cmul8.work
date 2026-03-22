"""Kimi 2.5 (Moonshot AI) client - OpenAI compatible."""
import os
from openai import AsyncOpenAI

MOONSHOT_API_KEY = os.environ.get("MOONSHOT_API_KEY")
MOONSHOT_BASE_URL = "https://api.moonshot.ai/v1"  # Global API
MODEL = "kimi-k2-0711-preview"  # Latest Kimi K2 model


def get_kimi_client() -> AsyncOpenAI:
    """Get the Kimi (Moonshot AI) client."""
    if not MOONSHOT_API_KEY:
        raise ValueError("MOONSHOT_API_KEY environment variable is required")
    return AsyncOpenAI(
        api_key=MOONSHOT_API_KEY,
        base_url=MOONSHOT_BASE_URL,
    )


kimi = None


def init_kimi():
    """Initialize the Kimi client."""
    global kimi
    kimi = get_kimi_client()
    return kimi


async def call_kimi(
    messages: list[dict],
    response_format: dict | None = None,
    temperature: float = 0.7,
    max_tokens: int = 4096,
) -> str:
    """Call Kimi 2.5 API and return the response content."""
    global kimi
    if kimi is None:
        kimi = init_kimi()

    kwargs = {
        "model": MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    if response_format:
        kwargs["response_format"] = response_format

    response = await kimi.chat.completions.create(**kwargs)
    return response.choices[0].message.content
