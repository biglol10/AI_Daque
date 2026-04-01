# Design Ref: §5.1 — PII Detection & Masking
import re

PII_PATTERNS: dict[str, str] = {
    "phone": r"01[0-9]-?\d{3,4}-?\d{4}",
    "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
    "resident_id": r"\d{6}-?[1-4]\d{6}",
    "address": (
        r"(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원"
        r"|충북|충남|전북|전남|경북|경남|제주).{5,30}(동|리|로|길)\s?\d*"
    ),
}

_COMPILED_PATTERNS: dict[str, re.Pattern[str]] = {
    name: re.compile(pattern) for name, pattern in PII_PATTERNS.items()
}

MASK_TEXT = "[개인정보 삭제]"


def detect_pii(text: str) -> dict:
    """Detect PII in text.

    Returns:
        {"has_pii": bool, "types": list[str]}
    """
    detected_types: list[str] = []
    for name, pattern in _COMPILED_PATTERNS.items():
        if pattern.search(text):
            detected_types.append(name)
    return {"has_pii": len(detected_types) > 0, "types": detected_types}


def mask_pii(text: str) -> str:
    """Replace all PII occurrences with [개인정보 삭제]."""
    result = text
    for pattern in _COMPILED_PATTERNS.values():
        result = pattern.sub(MASK_TEXT, result)
    return result
