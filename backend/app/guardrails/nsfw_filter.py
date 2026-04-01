# Design Ref: §14.3 — NSFW 필터
# Image generation prompt safety filter

import re

NSFW_KEYWORDS: list[str] = [
    "nude",
    "naked",
    "explicit",
    "sexual",
    "pornographic",
    "erotic",
    "hentai",
    "violent",
    "gore",
    "weapon",
    "blood",
    "murder",
    "torture",
    "drug",
    "suicide",
    "self-harm",
    "racism",
    "hate",
    "slur",
    "obscene",
]

SAFETY_SUFFIX = (
    "Safe for all ages, family-friendly cartoon illustration, "
    "no violence, no weapons, no nudity, wholesome warm tone."
)


def check_prompt(prompt: str) -> str:
    """Remove NSFW keywords from prompt and append safety instructions.

    Args:
        prompt: The raw image generation prompt.

    Returns:
        A sanitized prompt with NSFW terms removed and safety suffix appended.
    """
    sanitized = prompt
    for keyword in NSFW_KEYWORDS:
        pattern = re.compile(re.escape(keyword), re.IGNORECASE)
        sanitized = pattern.sub("", sanitized)

    # Clean up any double spaces left after removal
    sanitized = re.sub(r"\s{2,}", " ", sanitized).strip()

    # Append safety suffix if not already present
    if SAFETY_SUFFIX not in sanitized:
        sanitized = f"{sanitized}. {SAFETY_SUFFIX}"

    return sanitized
