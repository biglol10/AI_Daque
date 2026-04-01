# Design Ref: §5.2 — 서사 구조화 엔진 (narrative → scene breakdown → narration script)
# Plan SC: FR-03 서사 구조화 엔진
from app.core.openai import openai_client as client


async def structure_narrative(
    era: str,
    raw_text: str,
    birth_year: int,
) -> dict:
    """사용자 입력(인터뷰 요약 또는 템플릿 텍스트)을 구조화된 서사로 변환"""
    era_start = birth_year + int(era.replace("대", "").replace("60+", "60"))
    era_end = era_start + 9

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": f"""당신은 다큐멘터리 서사 구조화 전문가입니다.
사용자의 {era} 시절({era_start}~{era_end}년) 이야기를 다큐멘터리 서사 구조로 변환하세요.

반드시 아래 JSON 형식으로 응답하세요:
{{
  "title": "에피소드 제목 (감성적, 10자 내외)",
  "synopsis": "한 줄 요약 (30자 내외)",
  "scenes": [
    {{
      "scene_id": "scene_1",
      "title": "장면 제목",
      "description": "장면 설명 (구체적 상황, 감정, 배경 포함)",
      "duration_sec": 15,
      "emotion": "감정 키워드 (기쁨/슬픔/그리움/설렘/감동 등)",
      "background_prompt": "이 장면의 시대배경 이미지 프롬프트 (영문)"
    }}
  ]
}}

규칙:
- 3~5개 장면으로 구성 (총 60~90초 분량)
- 기승전결 구조 (도입 → 전개 → 절정 → 마무리)
- 각 장면은 15~20초
- background_prompt는 한국의 {era_start}~{era_end}년대 시대 특징을 반영"""
            },
            {"role": "user", "content": raw_text},
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
    )

    import json
    return json.loads(response.choices[0].message.content)


async def generate_narration_script(
    era: str,
    structured_narrative: dict,
) -> str:
    """구조화된 서사를 TTS용 나레이션 스크립트로 변환"""
    scenes_text = "\n".join(
        f"장면 {i+1}: {s['title']} - {s['description']} (감정: {s['emotion']})"
        for i, s in enumerate(structured_narrative.get("scenes", []))
    )

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": f"""당신은 다큐멘터리 나레이션 작가입니다.
아래 장면 구성을 바탕으로 {era} 시절 다큐멘터리 나레이션 스크립트를 작성하세요.

규칙:
- 1인칭 시점 ("그때 나는...", "그 시절...")
- 따뜻하고 감성적인 톤
- 각 장면별로 2~3문장
- 장면 사이에 [pause] 마커 삽입
- 총 분량: 60~90초 분량 (약 200~300자)
- 자연스러운 한국어 구어체"""
            },
            {"role": "user", "content": f"에피소드: {structured_narrative.get('title', '')}\n\n{scenes_text}"},
        ],
        temperature=0.8,
    )

    return response.choices[0].message.content
