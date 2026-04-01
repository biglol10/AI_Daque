"""
프리셋 캐릭터 12장을 DALL-E 3로 생성하는 스크립트.
1회만 실행하면 됩니다. 생성된 이미지는 frontend/public/presets/에 저장됩니다.

사용법:
  1. backend/.env에 OPENAI_API_KEY 설정
  2. pip install openai httpx
  3. python scripts/generate_presets.py

비용: 12장 × $0.04 = 약 $0.48
"""

import asyncio
import os
import sys

import httpx
from openai import AsyncOpenAI

# 프로젝트 루트 기준 경로
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "frontend", "public", "presets")

# .env에서 API 키 읽기
ENV_PATH = os.path.join(PROJECT_ROOT, "backend", ".env")
api_key = None
if os.path.exists(ENV_PATH):
    with open(ENV_PATH, "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("OPENAI_API_KEY="):
                api_key = line.strip().split("=", 1)[1]

if not api_key:
    print("ERROR: backend/.env에 OPENAI_API_KEY가 설정되지 않았습니다.")
    sys.exit(1)

client = AsyncOpenAI(api_key=api_key)

# 12개 프리셋 캐릭터 정의
PRESETS = [
    {
        "id": "boy_child",
        "name": "소년",
        "prompt": "A cute chibi-style Korean boy character, round face, big sparkling eyes, short black hair, wearing a casual t-shirt and shorts, warm smile, standing pose, solid pastel yellow background, adorable cartoon illustration style, clean lines",
    },
    {
        "id": "girl_child",
        "name": "소녀",
        "prompt": "A cute chibi-style Korean girl character, round face, big sparkling eyes, black hair in twin tails with ribbons, wearing a cute dress, warm smile, standing pose, solid pastel pink background, adorable cartoon illustration style, clean lines",
    },
    {
        "id": "boy_teen",
        "name": "남학생",
        "prompt": "A cute chibi-style Korean teenage boy character, round face, big eyes, neat black hair, wearing a Korean high school uniform (blazer and tie), friendly expression, standing pose, solid pastel blue background, adorable cartoon illustration style, clean lines",
    },
    {
        "id": "girl_teen",
        "name": "여학생",
        "prompt": "A cute chibi-style Korean teenage girl character, round face, big eyes, black hair in a ponytail, wearing a Korean high school uniform (blazer and plaid skirt), cheerful expression, standing pose, solid pastel lavender background, adorable cartoon illustration style, clean lines",
    },
    {
        "id": "man_young",
        "name": "청년 남성",
        "prompt": "A cute chibi-style young Korean man character, round face, big eyes, modern short hairstyle, wearing a casual hoodie and jeans, confident smile, standing pose, solid pastel green background, adorable cartoon illustration style, clean lines",
    },
    {
        "id": "woman_young",
        "name": "청년 여성",
        "prompt": "A cute chibi-style young Korean woman character, round face, big eyes, shoulder-length black hair, wearing a trendy blouse and skirt, bright smile, standing pose, solid pastel coral background, adorable cartoon illustration style, clean lines",
    },
    {
        "id": "man_middle",
        "name": "중년 남성",
        "prompt": "A cute chibi-style middle-aged Korean man character, round face, big eyes, slightly receding hairline, wearing a neat polo shirt and slacks, warm fatherly smile, standing pose, solid pastel olive background, adorable cartoon illustration style, clean lines",
    },
    {
        "id": "woman_middle",
        "name": "중년 여성",
        "prompt": "A cute chibi-style middle-aged Korean woman character, round face, big eyes, short permed black hair, wearing a comfortable cardigan, warm motherly smile, standing pose, solid pastel peach background, adorable cartoon illustration style, clean lines",
    },
    {
        "id": "man_senior",
        "name": "할아버지",
        "prompt": "A cute chibi-style elderly Korean grandfather character, round face, big kind eyes, grey hair, wearing a traditional Korean vest (joggi) over a shirt, gentle wise smile, standing pose, solid pastel beige background, adorable cartoon illustration style, clean lines",
    },
    {
        "id": "woman_senior",
        "name": "할머니",
        "prompt": "A cute chibi-style elderly Korean grandmother character, round face, big kind eyes, grey hair in a bun, wearing a comfortable hanbok-inspired blouse, gentle warm smile, standing pose, solid pastel cream background, adorable cartoon illustration style, clean lines",
    },
    {
        "id": "person_glasses",
        "name": "안경 쓴 사람",
        "prompt": "A cute chibi-style Korean person character with round glasses, round face, big curious eyes, neat black hair, wearing a smart casual button-up shirt, intellectual friendly smile, standing pose, solid pastel mint background, adorable cartoon illustration style, clean lines",
    },
    {
        "id": "person_creative",
        "name": "크리에이터",
        "prompt": "A cute chibi-style Korean creative person character, round face, big expressive eyes, slightly messy trendy hair with a small beret, wearing an artistic striped shirt, playful smile, standing pose, solid pastel orange background, adorable cartoon illustration style, clean lines",
    },
]


async def generate_one(preset: dict) -> None:
    """프리셋 하나 생성."""
    output_path = os.path.join(OUTPUT_DIR, f"{preset['id']}.png")

    if os.path.exists(output_path):
        print(f"  [SKIP] {preset['name']} ({preset['id']}) — 이미 존재")
        return

    print(f"  [GEN]  {preset['name']} ({preset['id']}) — 생성 중...")
    try:
        response = await client.images.generate(
            model="dall-e-3",
            prompt=preset["prompt"],
            size="1024x1024",
            quality="standard",
            n=1,
        )

        image_url = response.data[0].url
        if not image_url:
            print(f"  [FAIL] {preset['name']} — URL 없음")
            return

        # 이미지 다운로드
        async with httpx.AsyncClient() as http:
            img_response = await http.get(image_url)
            img_response.raise_for_status()

            with open(output_path, "wb") as f:
                f.write(img_response.content)

        print(f"  [OK]   {preset['name']} → {output_path}")

    except Exception as e:
        print(f"  [FAIL] {preset['name']} — {e}")


async def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"프리셋 캐릭터 생성 시작 ({len(PRESETS)}장)")
    print(f"저장 경로: {OUTPUT_DIR}")
    print(f"예상 비용: ${len(PRESETS) * 0.04:.2f}")
    print()

    # 순차 실행 (DALL-E rate limit 대응)
    for preset in PRESETS:
        await generate_one(preset)

    # 메타데이터 JSON 생성
    import json
    meta_path = os.path.join(OUTPUT_DIR, "presets.json")
    meta = [
        {"id": p["id"], "name": p["name"], "image": f"/presets/{p['id']}.png"}
        for p in PRESETS
    ]
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print(f"\n메타데이터 저장: {meta_path}")
    print("완료!")


if __name__ == "__main__":
    asyncio.run(main())
