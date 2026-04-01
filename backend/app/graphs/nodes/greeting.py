# Design Ref: §5.1 — Greeting Node
from app.core.openai import openai_client
from app.graphs.state import InterviewState

ERA_TOPICS: dict[str, list[str]] = {
    "10대": ["학교생활", "친구", "가족", "첫경험", "꿈", "취미", "선생님", "시험"],
    "20대": ["대학생활", "첫 직장", "연애", "독립", "여행", "우정", "자아 탐색", "도전"],
    "30대": ["결혼", "육아", "커리어", "건강", "가족관계", "재테크", "자기계발", "전환점"],
    "40대": ["자녀교육", "부모돌봄", "직장생활", "건강관리", "인간관계", "취미", "성찰", "목표"],
    "50대": ["은퇴준비", "자녀독립", "건강", "부부관계", "인생회고", "새로운시작", "여행", "봉사"],
    "60대 이상": ["은퇴생활", "손주", "건강관리", "인생지혜", "추억", "감사", "일상", "유산"],
}

ERA_CONTEXT: dict[str, str] = {
    "10대": "학교, 친구, 가족과 함께한 성장기의 이야기가 궁금해요.",
    "20대": "도전과 변화로 가득했던 청춘의 이야기를 들려주세요.",
    "30대": "삶의 기반을 다졌던 시기의 소중한 경험들이 궁금합니다.",
    "40대": "인생의 중반, 깊어진 경험과 지혜의 이야기를 나눠주세요.",
    "50대": "원숙해진 삶의 이야기와 새로운 시작에 대해 들려주세요.",
    "60대 이상": "풍요로운 인생 경험과 지혜를 나눠주시면 감사하겠습니다.",
}


async def greeting(state: InterviewState) -> dict:
    """Generate a warm opening message for the interview era."""
    era = state["era"]
    topics = ERA_TOPICS.get(era, ERA_TOPICS["20대"])
    context = ERA_CONTEXT.get(era, ERA_CONTEXT["20대"])

    response = await openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "당신은 따뜻하고 공감 능력이 뛰어난 인터뷰어입니다. "
                    "사용자의 인생 이야기를 경청하고 기록하는 역할을 합니다. "
                    "항상 한국어로 대화하며, 존댓말을 사용합니다. "
                    "짧고 따뜻한 인사와 함께 인터뷰를 시작하세요."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"{era} 시절 인터뷰를 시작합니다. "
                    f"배경 맥락: {context} "
                    f"따뜻한 인사와 함께 첫 질문을 해주세요."
                ),
            },
        ],
        temperature=0.8,
        max_tokens=300,
    )

    greeting_message = response.choices[0].message.content

    return {
        "messages": [{"role": "assistant", "content": greeting_message}],
        "topics_remaining": topics,
        "topics_covered": [],
        "question_count": 1,
        "depth_score": 0.0,
        "key_events": [],
        "emotions": [],
        "is_complete": False,
        "pii_detected": False,
        "redirect_count": 0,
        "last_guardrail_action": None,
        "summary": None,
        "suggested_questions": [],
    }
