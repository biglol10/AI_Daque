# Design Ref: §5.1 — Summary Generation Node
import json

from app.core.openai import openai_client
from app.graphs.state import InterviewState


async def summarize(state: InterviewState) -> dict:
    """Generate a narrative summary of the era interview."""
    era = state["era"]
    key_events = state.get("key_events", [])
    emotions = state.get("emotions", [])
    topics_covered = state.get("topics_covered", [])

    # Build conversation transcript from messages
    messages = state.get("messages", [])
    transcript_parts: list[str] = []
    for msg in messages:
        msg_type = msg.type if hasattr(msg, "type") else msg.get("role", "")
        content = msg.content if hasattr(msg, "content") else msg.get("content", "")
        if msg_type in ("human", "user"):
            transcript_parts.append(f"사용자: {content}")
        elif msg_type in ("ai", "assistant"):
            transcript_parts.append(f"인터뷰어: {content}")

    transcript = "\n".join(transcript_parts)

    events_text = ""
    if key_events:
        events_text = "주요 사건들:\n"
        for event in key_events:
            events_text += (
                f"- {event.get('title', '무제')}: "
                f"{event.get('description', '')} "
                f"(감정: {event.get('emotion', '알 수 없음')})\n"
            )

    response = await openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "당신은 인생 다큐멘터리 나레이션 작가입니다. "
                    "인터뷰 내용을 바탕으로 감동적인 나레이션 대본을 작성합니다.\n"
                    "반드시 아래 JSON 형식으로만 응답하세요.\n\n"
                    "{\n"
                    '  "narrative_summary": "3인칭 나레이션 형식의 요약문 (200-400자)",\n'
                    '  "key_events": [{"year": 0, "title": "", "description": "", "emotion": ""}],\n'
                    '  "narration_script": "TTS용 나레이션 대본 (감정이 담긴 톤으로, 300-500자)"\n'
                    "}\n\n"
                    "나레이션은 따뜻하고 회고적인 톤으로 작성하세요."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"시대: {era}\n"
                    f"다룬 주제: {', '.join(topics_covered)}\n"
                    f"감정 키워드: {', '.join(emotions)}\n"
                    f"{events_text}\n"
                    f"인터뷰 전문:\n{transcript}\n\n"
                    "위 내용을 바탕으로 나레이션을 작성해주세요."
                ),
            },
        ],
        temperature=0.7,
        max_tokens=1000,
    )

    raw = response.choices[0].message.content.strip()

    # Parse JSON — handle markdown code block wrapping
    if raw.startswith("```"):
        lines = raw.split("\n")
        json_lines = [l for l in lines if not l.startswith("```")]
        raw = "\n".join(json_lines)

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        result = {
            "narrative_summary": f"{era} 시절의 소중한 이야기들을 들을 수 있었습니다.",
            "key_events": key_events,
            "narration_script": f"{era} 시절, 그때의 기억들이 하나둘 떠오릅니다.",
        }

    summary_text = result.get("narrative_summary", "")
    final_events = result.get("key_events", key_events)
    narration = result.get("narration_script", "")

    closing_message = (
        f"{era} 시절 이야기를 들려주셔서 감사합니다. "
        "소중한 기억들을 잘 정리하겠습니다."
    )

    return {
        "messages": [{"role": "assistant", "content": closing_message}],
        "is_complete": True,
        "summary": summary_text,
        "key_events": final_events,
        "suggested_questions": [],
    }
