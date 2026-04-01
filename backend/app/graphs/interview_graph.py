# Design Ref: §5.1 — Interview StateGraph Compilation
import logging

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph

from app.core.config import settings

logger = logging.getLogger(__name__)

from app.graphs.nodes.analyze import analyze
from app.graphs.nodes.ask_question import ask_question
from app.graphs.nodes.greeting import greeting
from app.graphs.nodes.guardrail import guardrail
from app.graphs.nodes.redirect import redirect
from app.graphs.nodes.should_deepen import should_deepen
from app.graphs.nodes.summarize import summarize
from app.graphs.state import InterviewState


def _route_entry(state: InterviewState) -> str:
    """Route at entry: greeting for first run, guardrail for subsequent."""
    question_count = state.get("question_count", 0)
    if question_count == 0:
        return "greeting"
    return "guardrail"


def _route_after_guardrail(state: InterviewState) -> str:
    """Route based on guardrail action."""
    action = state.get("last_guardrail_action")
    if action == "redirect":
        return "redirect"
    return "analyze"


def create_interview_graph():
    """Build and compile the interview LangGraph StateGraph.

    Flow:
        START -> router -> [greeting | guardrail]
        greeting -> END (wait for user input)
        guardrail -> [redirect | analyze]
        analyze -> should_deepen -> [ask_question | summarize]
        ask_question -> END (wait for user input)
        redirect -> END (wait for user input)
        summarize -> END (interview complete)

    For MVP, uses MemorySaver (in-memory checkpointer) instead of
    PostgresSaver to avoid external DB setup complexity.
    """
    graph = StateGraph(InterviewState)

    # Add nodes
    graph.add_node("greeting", greeting)
    graph.add_node("guardrail", guardrail)
    graph.add_node("analyze", analyze)
    graph.add_node("ask_question", ask_question)
    graph.add_node("redirect", redirect)
    graph.add_node("summarize", summarize)

    # Entry: conditional routing from START
    graph.add_conditional_edges(
        START,
        _route_entry,
        {
            "greeting": "greeting",
            "guardrail": "guardrail",
        },
    )

    # greeting -> END (wait for user input; next invoke resumes via router)
    graph.add_edge("greeting", END)

    # guardrail -> conditional: redirect or analyze
    graph.add_conditional_edges(
        "guardrail",
        _route_after_guardrail,
        {
            "redirect": "redirect",
            "analyze": "analyze",
        },
    )

    # analyze -> conditional: ask_question or summarize
    graph.add_conditional_edges(
        "analyze",
        should_deepen,
        {
            "ask_question": "ask_question",
            "summarize": "summarize",
        },
    )

    # Terminal edges
    graph.add_edge("ask_question", END)
    graph.add_edge("redirect", END)
    graph.add_edge("summarize", END)

    # Checkpointer: Redis if available, fallback to in-memory
    checkpointer = _create_checkpointer()
    compiled = graph.compile(checkpointer=checkpointer)

    return compiled


def _create_checkpointer():
    """Redis가 설정되어 있으면 RedisSaver, 아니면 MemorySaver (개발용)."""
    redis_url = settings.redis_url
    if redis_url and redis_url != "redis://localhost:6379":
        try:
            from langgraph.checkpoint.redis import RedisSaver
            logger.info("Using RedisSaver checkpointer: %s", redis_url)
            return RedisSaver(url=redis_url)
        except Exception as e:
            logger.warning("RedisSaver 초기화 실패, MemorySaver로 fallback: %s", e)

    logger.info("Using MemorySaver checkpointer (in-memory, 서버 재시작 시 데이터 소실)")
    return MemorySaver()


# Module-level singleton — created once, reused across requests
interview_graph = create_interview_graph()
