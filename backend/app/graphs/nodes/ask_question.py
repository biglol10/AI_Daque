# Design Ref: §5.1 — Question Generation Node
import json

from app.core.openai import openai_client
from app.graphs.state import InterviewState


async def ask_question(state: InterviewState) -> dict:
    """Generate a follow-up question based on conversation history."""
    era = state["era"]
    topics_remaining = state.get("topics_remaining", [])
    topics_covered = state.get("topics_covered", [])
    question_count = state.get("question_count", 0)
    key_events = state.get("key_events", [])

    # Build context about what we know so far
    events_summary = ""
    if key_events:
        events_summary = "지금까지 알게 된 주요 사건들:\n"
        for event in key_events:
            events_summary += f"- {event.get('title', '')}: {event.get('description', '')}\n"

    next_topic = topics_remaining[0] if topics_remaining else "자유 주제"

    # Build message history for context (last 10 messages to stay within limits)
    conversation_messages = []
    raw_messages = state.get("messages", [])
    recent_messages = raw_messages[-10:] if len(raw_messages) > 10 else raw_messages
    for msg in recent_messages:
        role = msg.type if hasattr(msg, "type") else msg.get("role", "user")
        content = msg.content if hasattr(msg, "content") else msg.get("content", "")
        # Map LangChain message types to OpenAI roles
        if role == "human":
            role = "user"
        elif role == "ai":
            role = "assistant"
        conversation_messages.append({"role": role, "content": content})

    system_prompt = (
        "당신은 따뜻하고 공감 능력이 뛰어난 인터뷰어입니다. "
        "사용자의 인생 이야기를 경청하고 기록하는 역할을 합니다. "
        "항상 한국어로 대화하며, 존댓말을 사용합니다.\n\n"
        f"현재 {era} 시절에 대해 인터뷰 중입니다.\n"
        f"다음에 다룰 주제: {next_topic}\n"
        f"이미 다룬 주제: {', '.join(topics_covered) if topics_covered else '없음'}\n"
        f"{events_summary}\n"
        "규칙:\n"
        "1. 이전 답변을 참고하여 자연스럽게 이어지는 질문을 하세요.\n"
        "2. 개방형 질문을 사용하세요.\n"
        "3. 공감과 관심을 표현하세요.\n"
        "4. 한 번에 하나의 질문만 하세요.\n"
        "5. 질문은 2-3문장 이내로 짧게 하세요."
    )

    messages_for_api = [{"role": "system", "content": system_prompt}]
    messages_for_api.extend(conversation_messages)
    messages_for_api.append({
        "role": "user",
        "content": f"다음 주제({next_topic})에 대해 자연스러운 후속 질문을 생성해주세요.",
    })

    response = await openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages_for_api,
        temperature=0.8,
        max_tokens=300,
    )

    question = response.choices[0].message.content

    return {
        "messages": [{"role": "assistant", "content": question}],
        "question_count": question_count + 1,
    }
