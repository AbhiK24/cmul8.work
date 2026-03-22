"""Embedding generation using Kimi K2.

Since Kimi doesn't have a dedicated embeddings API, we use a hybrid approach:
1. For storage: Generate a semantic summary/keywords for each memory
2. For retrieval: Use Kimi to score relevance directly

This aligns with the Generative Agents paper which used LLM-based importance scoring.
"""
from .kimi_client import call_kimi


async def generate_semantic_summary(text: str) -> str:
    """Generate a semantic summary/keywords for a memory.

    This is used for efficient retrieval without vector embeddings.
    """
    prompt = f"""Extract 5-7 key semantic concepts from this text as a comma-separated list.
Focus on: topics, emotions, intentions, relationships, and actions.

Text: "{text}"

Output only the comma-separated keywords, nothing else."""

    response = await call_kimi(
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,
        max_tokens=100
    )
    return response.strip()


async def score_relevance_batch(query: str, memories: list[str]) -> list[float]:
    """Score relevance of multiple memories to a query using Kimi K2.

    Returns scores normalized to [0, 1] range.
    """
    if not memories:
        return []

    # Format memories for batch scoring
    memory_list = "\n".join([f"{i+1}. {m}" for i, m in enumerate(memories)])

    prompt = f"""Rate the relevance of each memory to the query on a scale of 0.0 to 1.0.
Consider semantic similarity, contextual relevance, and usefulness for responding.

Query: "{query}"

Memories:
{memory_list}

Output ONLY a comma-separated list of scores (one per memory), like: 0.8, 0.3, 0.9, 0.2
No other text."""

    response = await call_kimi(
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,
        max_tokens=100
    )

    try:
        scores = [float(s.strip()) for s in response.strip().split(",")]
        # Ensure we have the right number of scores and clamp to [0, 1]
        while len(scores) < len(memories):
            scores.append(0.5)
        return [max(0.0, min(1.0, s)) for s in scores[:len(memories)]]
    except (ValueError, IndexError):
        return [0.5] * len(memories)  # Default to medium relevance
