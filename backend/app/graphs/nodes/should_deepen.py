# Design Ref: §5.1 — Deepening Condition (Conditional Edge)
from app.graphs.state import InterviewState


def should_deepen(state: InterviewState) -> str:
    """Conditional edge: decide whether to ask more questions or summarize.

    Returns:
        "ask_question" if more depth is needed and question limit not reached.
        "summarize" if sufficient depth or question limit reached.
    """
    depth_score = state.get("depth_score", 0.0)
    question_count = state.get("question_count", 0)
    max_questions = state.get("max_questions", 10)

    if depth_score >= 0.6 or question_count >= max_questions:
        return "summarize"

    return "ask_question"
