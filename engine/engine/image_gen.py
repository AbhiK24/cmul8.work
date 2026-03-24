"""BytePlus ModelArk image generation client."""
import os
import httpx
from typing import Literal

BYTEPLUS_API_KEY = os.environ.get("BYTEPLUS_API_KEY")
BYTEPLUS_BASE_URL = "https://ark.ap-southeast.bytepluses.com/api/v3"

# Available models
MODELS = {
    "seedream-5": "seedream-5-0-260128",
    "seedream-4": "seedream-4-0-250828",
    "seedream-3": "seedream-3-0-t2i-250415",
}

DEFAULT_MODEL = "seedream-3"  # Fast and good quality


async def generate_image(
    prompt: str,
    model: str = DEFAULT_MODEL,
    size: Literal["1K", "2K", "4K"] = "1K",
    response_format: Literal["url", "b64_json"] = "url",
    watermark: bool = False,
) -> dict:
    """
    Generate an image using BytePlus Seedream models.

    Args:
        prompt: Text description of the image to generate
        model: Model shortname (seedream-5, seedream-4, seedream-3)
        size: Output resolution (1K, 2K, 4K)
        response_format: Return URL or base64 encoded image
        watermark: Whether to add watermark

    Returns:
        dict with 'url' or 'b64_json' key depending on response_format
    """
    if not BYTEPLUS_API_KEY:
        raise ValueError("BYTEPLUS_API_KEY environment variable is required")

    model_id = MODELS.get(model, MODELS[DEFAULT_MODEL])

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{BYTEPLUS_BASE_URL}/images/generations",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {BYTEPLUS_API_KEY}",
            },
            json={
                "model": model_id,
                "prompt": prompt,
                "size": size,
                "response_format": response_format,
                "watermark": watermark,
            },
        )
        response.raise_for_status()
        data = response.json()

        # BytePlus returns data in OpenAI-compatible format
        if data.get("data") and len(data["data"]) > 0:
            return data["data"][0]

        return data


async def generate_diagram(
    description: str,
    diagram_type: Literal["flowchart", "architecture", "sequence", "mindmap", "org_chart"] = "flowchart",
) -> dict:
    """
    Generate a diagram/sketch based on description.

    Args:
        description: What the diagram should show
        diagram_type: Type of diagram to generate

    Returns:
        dict with 'url' key containing the generated diagram image
    """
    style_prompts = {
        "flowchart": "clean hand-drawn flowchart diagram, whiteboard sketch style, boxes and arrows, black lines on white background",
        "architecture": "software architecture diagram, system components, clean technical illustration, boxes connected with lines",
        "sequence": "sequence diagram, vertical timeline, message arrows between participants, technical drawing style",
        "mindmap": "mind map diagram, central concept with branching ideas, organic hand-drawn style",
        "org_chart": "organizational chart, hierarchical boxes, reporting structure, clean professional style",
    }

    style = style_prompts.get(diagram_type, style_prompts["flowchart"])
    full_prompt = f"{style}, showing: {description}"

    return await generate_image(full_prompt, model="seedream-3", size="1K")


async def generate_scene(
    description: str,
    scene_type: Literal["office", "warehouse", "meeting_room", "workspace", "server_room"] = "office",
) -> dict:
    """
    Generate a workplace scene image.

    Args:
        description: Specific details about the scene
        scene_type: Type of workplace environment

    Returns:
        dict with 'url' key containing the generated scene image
    """
    style_prompts = {
        "office": "modern open office space, desks and computers, natural lighting",
        "warehouse": "industrial warehouse interior, shelving and inventory, wide angle",
        "meeting_room": "corporate meeting room, conference table, glass walls",
        "workspace": "individual workspace desk, monitors and equipment, professional",
        "server_room": "data center server room, racks of equipment, blue lighting",
    }

    style = style_prompts.get(scene_type, style_prompts["office"])
    full_prompt = f"{style}, {description}, photorealistic, professional photography"

    return await generate_image(full_prompt, model="seedream-4", size="2K")


async def generate_handwritten_notes(
    content: str,
    style: Literal["neat", "messy", "bullet_points"] = "neat",
) -> dict:
    """
    Generate an image of handwritten notes.

    Args:
        content: What the notes should contain
        style: Handwriting style

    Returns:
        dict with 'url' key containing the generated notes image
    """
    style_prompts = {
        "neat": "clean handwritten notes on lined paper, blue pen, organized",
        "messy": "quick handwritten notes, scratchy pen, informal, some crossing out",
        "bullet_points": "handwritten bullet point list, notebook paper, neat formatting",
    }

    style_desc = style_prompts.get(style, style_prompts["neat"])
    full_prompt = f"{style_desc}, notes contain: {content}"

    return await generate_image(full_prompt, model="seedream-3", size="1K")


async def generate_chart(
    description: str,
    chart_type: Literal["bar", "line", "pie", "dashboard"] = "bar",
) -> dict:
    """
    Generate a data visualization chart.

    Args:
        description: What data/trend the chart should show
        chart_type: Type of chart visualization

    Returns:
        dict with 'url' key containing the generated chart image
    """
    style_prompts = {
        "bar": "bar chart visualization, clean design, labeled axes",
        "line": "line graph, trend over time, data points marked",
        "pie": "pie chart, percentage segments, color coded with legend",
        "dashboard": "analytics dashboard screenshot, multiple metrics, modern UI",
    }

    style = style_prompts.get(chart_type, style_prompts["bar"])
    full_prompt = f"{style}, showing: {description}, professional business visualization"

    return await generate_image(full_prompt, model="seedream-3", size="1K")
