# Design Ref: §5.1 — InterviewState TypedDict
from typing import Annotated, TypedDict

from langgraph.graph.message import add_messages


class InterviewState(TypedDict):
    messages: Annotated[list, add_messages]
    project_id: str
    user_id: str
    era: str  # '10대', '20대', etc.
    birth_year: int
    question_count: int
    max_questions: int  # default 10
    depth_score: float  # 0.0 ~ 1.0
    is_complete: bool
    key_events: list[dict]  # [{year, title, description, emotion}]
    emotions: list[str]
    topics_covered: list[str]
    topics_remaining: list[str]
    pii_detected: bool
    redirect_count: int
    last_guardrail_action: str | None  # 'pass' | 'redirect' | 'block'
    summary: str | None
    suggested_questions: list[str]
