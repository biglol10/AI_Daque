# Design Ref: §5.1 — Guardrail Node
from app.graphs.state import InterviewState
from app.guardrails.content_filter import check_sensitive
from app.guardrails.pii_detector import detect_pii, mask_pii


async def guardrail(state: InterviewState) -> dict:
    """Check the last user message for PII and sensitive content."""
    messages = state.get("messages", [])
    if not messages:
        return {"last_guardrail_action": "pass", "pii_detected": False}

    # Get the last message (should be the user's message)
    last_message = messages[-1]
    content = last_message.content if hasattr(last_message, "content") else last_message.get("content", "")

    updates: dict = {}

    # Check PII
    pii_result = detect_pii(content)
    if pii_result["has_pii"]:
        masked_content = mask_pii(content)
        # Replace the last message content with masked version
        updates["messages"] = [{"role": "human", "content": masked_content}]
        updates["pii_detected"] = True
    else:
        updates["pii_detected"] = state.get("pii_detected", False)

    # Check sensitive content
    sensitive_result = check_sensitive(content)
    if sensitive_result["is_sensitive"]:
        updates["last_guardrail_action"] = "redirect"
        updates["redirect_count"] = state.get("redirect_count", 0) + 1
    else:
        updates["last_guardrail_action"] = "pass"

    return updates
