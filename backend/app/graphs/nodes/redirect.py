# Design Ref: §5.1 — Safe Topic Redirect Node
from app.graphs.state import InterviewState


async def redirect(state: InterviewState) -> dict:
    """Generate a gentle redirect message when sensitive content is detected."""
    topics_remaining = state.get("topics_remaining", [])
    redirect_count = state.get("redirect_count", 0)

    # Pick a safe topic
    safe_topic = topics_remaining[0] if topics_remaining else "즐거웠던 추억"

    redirect_message = (
        f"이 부분은 힘드셨겠네요. 충분히 이해합니다. "
        f"괜찮으시다면, {safe_topic}에 대한 이야기로 넘어가볼까요? "
        f"편하신 이야기부터 천천히 해주시면 됩니다."
    )

    return {
        "messages": [{"role": "assistant", "content": redirect_message}],
        "last_guardrail_action": "redirect",
        "redirect_count": redirect_count,
    }
