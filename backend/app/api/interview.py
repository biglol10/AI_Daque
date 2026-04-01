# Design Ref: §5.1 — FastAPI Interview Endpoints
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.auth import verify_token

from app.graphs.interview_graph import interview_graph
from app.guardrails.cost_limiter import cost_limiter

router = APIRouter(prefix="/interview", tags=["interview"])


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------

class InterviewStartRequest(BaseModel):
    project_id: str
    user_id: str
    era: str = Field(description="시대 구분: '10대', '20대', '30대', '40대', '50대', '60대 이상'")
    birth_year: int = Field(ge=1920, le=2020)
    max_questions: int = Field(default=10, ge=3, le=30)


class InterviewStartResponse(BaseModel):
    interview_id: str
    greeting_message: str
    era: str
    topics: list[str]


class InterviewMessageRequest(BaseModel):
    interview_id: str
    message: str = Field(min_length=1, max_length=2000)


class InterviewMessageResponse(BaseModel):
    ai_message: str
    question_count: int
    depth_score: float
    is_complete: bool
    pii_detected: bool
    guardrail_action: str | None


class InterviewStatusResponse(BaseModel):
    interview_id: str
    era: str
    question_count: int
    max_questions: int
    depth_score: float
    is_complete: bool
    topics_covered: list[str]
    topics_remaining: list[str]
    key_events: list[dict]
    emotions: list[str]
    summary: str | None


class InterviewCompleteResponse(BaseModel):
    interview_id: str
    summary: str | None
    key_events: list[dict]
    is_complete: bool


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _get_last_ai_message(messages: list) -> str:
    """Extract the last assistant message content from the message list."""
    for msg in reversed(messages):
        msg_type = msg.type if hasattr(msg, "type") else msg.get("role", "")
        if msg_type in ("ai", "assistant"):
            return msg.content if hasattr(msg, "content") else msg.get("content", "")
    return ""


def _make_thread_config(interview_id: str) -> dict:
    """Create a LangGraph config dict with the thread ID for checkpointing."""
    return {"configurable": {"thread_id": interview_id}}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/start", response_model=InterviewStartResponse)
async def start_interview(req: InterviewStartRequest, user: dict = Depends(verify_token)):
    """Start a new interview session for a specific era."""
    # Cost check
    allowed = await cost_limiter.check(req.project_id, "interview_calls")
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="인터뷰 호출 한도를 초과했습니다. 나중에 다시 시도해주세요.",
        )

    interview_id = str(uuid.uuid4())

    initial_state = {
        "messages": [],
        "project_id": req.project_id,
        "user_id": req.user_id,
        "era": req.era,
        "birth_year": req.birth_year,
        "question_count": 0,
        "max_questions": req.max_questions,
        "depth_score": 0.0,
        "is_complete": False,
        "key_events": [],
        "emotions": [],
        "topics_covered": [],
        "topics_remaining": [],
        "pii_detected": False,
        "redirect_count": 0,
        "last_guardrail_action": None,
        "summary": None,
        "suggested_questions": [],
    }

    config = _make_thread_config(interview_id)

    # Run the graph — enters at "greeting" node
    result = await interview_graph.ainvoke(initial_state, config)

    greeting_message = _get_last_ai_message(result.get("messages", []))
    topics = result.get("topics_remaining", [])

    return InterviewStartResponse(
        interview_id=interview_id,
        greeting_message=greeting_message,
        era=req.era,
        topics=topics,
    )


@router.post("/message", response_model=InterviewMessageResponse)
async def send_message(req: InterviewMessageRequest, user: dict = Depends(verify_token)):
    """Send a user message and get an AI response."""
    config = _make_thread_config(req.interview_id)

    # Get current state to check if interview is already complete
    current_state = await interview_graph.aget_state(config)
    if not current_state or not current_state.values:
        raise HTTPException(
            status_code=404,
            detail="인터뷰 세션을 찾을 수 없습니다. 새 인터뷰를 시작해주세요.",
        )

    state_values = current_state.values
    if state_values.get("is_complete", False):
        raise HTTPException(
            status_code=400,
            detail="이미 완료된 인터뷰입니다.",
        )

    # Cost check
    project_id = state_values.get("project_id", "unknown")
    allowed = await cost_limiter.check(project_id, "interview_calls")
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="인터뷰 호출 한도를 초과했습니다.",
        )

    # Feed user message into the graph — the graph resumes at "guardrail"
    # because greeting already ran and ended. We update the state with the
    # new user message and invoke from the "guardrail" node onward.
    user_input = {
        "messages": [{"role": "human", "content": req.message}],
    }

    result = await interview_graph.ainvoke(
        user_input,
        config,
    )

    ai_message = _get_last_ai_message(result.get("messages", []))

    return InterviewMessageResponse(
        ai_message=ai_message,
        question_count=result.get("question_count", 0),
        depth_score=result.get("depth_score", 0.0),
        is_complete=result.get("is_complete", False),
        pii_detected=result.get("pii_detected", False),
        guardrail_action=result.get("last_guardrail_action"),
    )


@router.get("/{interview_id}/status", response_model=InterviewStatusResponse)
async def get_interview_status(interview_id: str, user: dict = Depends(verify_token)):
    """Get current interview status and progress."""
    config = _make_thread_config(interview_id)

    current_state = await interview_graph.aget_state(config)
    if not current_state or not current_state.values:
        raise HTTPException(
            status_code=404,
            detail="인터뷰 세션을 찾을 수 없습니다.",
        )

    s = current_state.values

    return InterviewStatusResponse(
        interview_id=interview_id,
        era=s.get("era", ""),
        question_count=s.get("question_count", 0),
        max_questions=s.get("max_questions", 10),
        depth_score=s.get("depth_score", 0.0),
        is_complete=s.get("is_complete", False),
        topics_covered=s.get("topics_covered", []),
        topics_remaining=s.get("topics_remaining", []),
        key_events=s.get("key_events", []),
        emotions=s.get("emotions", []),
        summary=s.get("summary"),
    )


@router.post("/{interview_id}/complete", response_model=InterviewCompleteResponse)
async def force_complete(interview_id: str, user: dict = Depends(verify_token)):
    """Force-complete an interview, triggering summarization."""
    config = _make_thread_config(interview_id)

    current_state = await interview_graph.aget_state(config)
    if not current_state or not current_state.values:
        raise HTTPException(
            status_code=404,
            detail="인터뷰 세션을 찾을 수 없습니다.",
        )

    state_values = current_state.values
    if state_values.get("is_complete", False):
        return InterviewCompleteResponse(
            interview_id=interview_id,
            summary=state_values.get("summary"),
            key_events=state_values.get("key_events", []),
            is_complete=True,
        )

    # Force max_questions to current count so should_deepen routes to summarize
    force_input = {
        "messages": [{"role": "human", "content": "인터뷰를 마무리해주세요."}],
        "max_questions": state_values.get("question_count", 0),
    }

    result = await interview_graph.ainvoke(force_input, config)

    return InterviewCompleteResponse(
        interview_id=interview_id,
        summary=result.get("summary"),
        key_events=result.get("key_events", []),
        is_complete=result.get("is_complete", False),
    )
