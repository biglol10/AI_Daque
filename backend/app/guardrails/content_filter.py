# Design Ref: §5.1 — Sensitive Content Filter

SENSITIVE_TOPICS: list[str] = [
    "자살",
    "자해",
    "학대",
    "성폭력",
    "마약",
    "극단적 폭력",
    "아동 착취",
    "테러",
]


def check_sensitive(text: str) -> dict:
    """Check text for sensitive topics.

    Returns:
        {"is_sensitive": bool, "detected_topics": list[str]}
    """
    detected: list[str] = [topic for topic in SENSITIVE_TOPICS if topic in text]
    return {"is_sensitive": len(detected) > 0, "detected_topics": detected}
