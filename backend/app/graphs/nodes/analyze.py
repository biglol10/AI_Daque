# Design Ref: §5.1 — Response Analysis Node
import json

from app.core.openai import openai_client
from app.graphs.state import InterviewState


async def analyze(state: InterviewState) -> dict:
    """Analyze the user's response to extract events, emotions, and depth."""
    messages = state.get("messages", [])
    if not messages:
        return {}

    # Find the last user message
    last_user_content = ""
    for msg in reversed(messages):
        msg_type = msg.type if hasattr(msg, "type") else msg.get("role", "")
        if msg_type in ("human", "user"):
            last_user_content = msg.content if hasattr(msg, "content") else msg.get("content", "")
            break

    if not last_user_content:
        return {}

    era = state["era"]
    existing_events = state.get("key_events", [])
    existing_emotions = state.get("emotions", [])
    topics_remaining = list(state.get("topics_remaining", []))
    topics_covered = list(state.get("topics_covered", []))

    response = await openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "당신은 인터뷰 응답 분석 전문가입니다. "
                    "사용자의 응답에서 핵심 사건, 감정, 깊이를 추출합니다.\n"
                    "반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.\n\n"
                    "{\n"
                    '  "key_events": [{"year": 0, "title": "", "description": "", "emotion": ""}],\n'
                    '  "emotions": ["감정1", "감정2"],\n'
                    '  "depth_score": 0.5,\n'
                    '  "topics_mentioned": ["주제1"]\n'
                    "}\n\n"
                    "depth_score 기준:\n"
                    "- 0.0~0.3: 짧거나 피상적인 답변\n"
                    "- 0.3~0.6: 구체적인 사건이나 감정이 포함된 답변\n"
                    "- 0.6~1.0: 상세한 서사, 풍부한 감정, 구체적 디테일이 포함된 답변\n"
                    f"현재 인터뷰 시대: {era}"
                ),
            },
            {
                "role": "user",
                "content": f"다음 응답을 분석해주세요:\n\n{last_user_content}",
            },
        ],
        temperature=0.3,
        max_tokens=500,
    )

    raw = response.choices[0].message.content.strip()

    # Parse JSON — handle markdown code block wrapping
    if raw.startswith("```"):
        lines = raw.split("\n")
        json_lines = [l for l in lines if not l.startswith("```")]
        raw = "\n".join(json_lines)

    try:
        analysis = json.loads(raw)
    except json.JSONDecodeError:
        # Fallback if parsing fails
        analysis = {
            "key_events": [],
            "emotions": [],
            "depth_score": 0.3,
            "topics_mentioned": [],
        }

    # Merge new events with existing
    new_events = existing_events + analysis.get("key_events", [])

    # Merge emotions (deduplicate)
    new_emotions = list(set(existing_emotions + analysis.get("emotions", [])))

    # Update topic tracking
    mentioned_topics = analysis.get("topics_mentioned", [])
    for topic in mentioned_topics:
        for remaining in topics_remaining:
            if topic in remaining or remaining in topic:
                if remaining not in topics_covered:
                    topics_covered.append(remaining)
                if remaining in topics_remaining:
                    topics_remaining.remove(remaining)
                break

    depth_score = float(analysis.get("depth_score", 0.3))

    return {
        "key_events": new_events,
        "emotions": new_emotions,
        "depth_score": depth_score,
        "topics_covered": topics_covered,
        "topics_remaining": topics_remaining,
    }
