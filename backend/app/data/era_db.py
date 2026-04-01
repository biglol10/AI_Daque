# Design Ref: §2.1 — era_references table / §5.2 — era DB
# Hardcoded Korean era reference database for 1960s through 2020s

ERA_DATABASE: dict[str, dict] = {
    "1960s": {
        "decade_label": "1960년대",
        "decade_start": 1960,
        "decade_end": 1969,
        "cultural_keywords": [
            "경제개발 5개년 계획",
            "농촌 근대화",
            "라디오 연속극 열풍",
            "트랜지스터 라디오",
            "연탄 배달",
            "봉제공장/구두공장 취업",
            "국민학교 입학",
            "장터 구경",
        ],
        "visual_elements": [
            "초가집과 기와집",
            "재래시장 좌판",
            "논밭과 소달구지",
            "교복 입은 학생들",
            "시내버스",
            "연탄 화덕",
            "우물가",
            "동네 구멍가게",
        ],
        "historical_events": [
            {"year": 1962, "event": "제1차 경제개발 5개년 계획 시작"},
            {"year": 1964, "event": "서울 인구 300만 돌파"},
            {"year": 1965, "event": "한일 국교 정상화"},
            {"year": 1968, "event": "경부고속도로 착공"},
            {"year": 1969, "event": "TV 보급 확대, 동네마다 TV 모여보기"},
        ],
        "image_prompt_template": (
            "1960s Korean rural village scene, thatched-roof houses (chogajip), "
            "traditional market, rice paddies, ox carts, students in uniforms, "
            "dusty dirt roads, old radio on wooden table, reconstruction era, "
            "warm cartoon illustration style"
        ),
    },
    "1970s": {
        "decade_label": "1970년대",
        "decade_start": 1970,
        "decade_end": 1979,
        "cultural_keywords": [
            "새마을운동",
            "경제 고도성장",
            "중동 건설 붐 (돈 벌러 가는 아빠들)",
            "경부고속도로 개통",
            "통기타 문화",
            "다방 데이트",
            "아파트 분양 시작",
            "짜장면이 외식의 꽃",
            "동네 목욕탕",
            "국민학교 소풍",
        ],
        "visual_elements": [
            "새마을 깃발",
            "공장 굴뚝",
            "버스 정류장",
            "다방",
            "흑백TV",
            "통기타",
            "연립주택/시장 골목",
            "빨래하는 어머니",
        ],
        "historical_events": [
            {"year": 1970, "event": "경부고속도로 개통, 새마을운동 시작"},
            {"year": 1973, "event": "아파트 대량 건설 시작"},
            {"year": 1974, "event": "서울 지하철 1호선 개통"},
            {"year": 1977, "event": "수출 100억 달러 달성"},
            {"year": 1979, "event": "컬러TV 시험 방송, 전화기 보급 확대"},
        ],
        "image_prompt_template": (
            "1970s Korean industrial era scene, Saemaul movement banners, "
            "factory chimneys, express highway, coffee shops (dabang), "
            "black-and-white TV, folk guitar culture, bus stations, "
            "warm cartoon illustration style"
        ),
    },
    "1980s": {
        "decade_label": "1980년대",
        "decade_start": 1980,
        "decade_end": 1989,
        "cultural_keywords": [
            "프로야구 출범 (야구 열풍)",
            "교복 자율화",
            "컬러TV 보급",
            "88올림픽",
            "아파트 단지 대량 입주",
            "오락실 (갤라가, 너구리)",
            "비디오 대여점",
            "동네 문방구 뽑기",
            "학원 뺑뺑이 시작",
            "짜장면 배달",
        ],
        "visual_elements": [
            "교복",
            "골목길 놀이 (딱지, 구슬치기)",
            "오락실",
            "VHS 비디오",
            "아파트 단지 놀이터",
            "문방구",
            "분식집 (떡볶이, 순대)",
            "연탄 가스 주의 스티커",
        ],
        "historical_events": [
            {"year": 1982, "event": "프로야구 출범, 컬러TV 방송 시작"},
            {"year": 1983, "event": "교복 자율화, 학생들 사복 입기 시작"},
            {"year": 1985, "event": "서울 지하철 2호선 순환 개통"},
            {"year": 1986, "event": "아시안게임 개최"},
            {"year": 1988, "event": "서울 올림픽, 온 국민이 TV 앞에"},
        ],
        "image_prompt_template": (
            "1980s Korean urban scene, apartment complexes (APT danji), "
            "narrow alleyways (golmok), arcade game rooms, video rental shops, "
            "students in school uniforms, color TV era, baseball stadium, "
            "warm cartoon illustration style"
        ),
    },
    "1990s": {
        "decade_label": "1990년대",
        "decade_start": 1990,
        "decade_end": 1999,
        "cultural_keywords": [
            "PC통신 하이텔/천리안",
            "HOT/젝스키스 아이돌 열풍",
            "서태지와 아이들",
            "삐삐/PCS 시대",
            "X세대 문화",
            "PC방 스타크래프트",
            "노래방 가기",
            "학교 앞 분식집",
            "수학여행",
            "대학 MT/축제",
        ],
        "visual_elements": [
            "PC방",
            "삐삐(무선호출기)",
            "교복",
            "비디오 대여점",
            "노래방",
            "롤러블레이드",
            "스티커 사진(프리쿠라)",
            "학교 앞 떡볶이집",
        ],
        "historical_events": [
            {"year": 1992, "event": "서태지와 아이들 데뷔, 신세대 문화 폭발"},
            {"year": 1994, "event": "인터넷 상용화 시작"},
            {"year": 1996, "event": "OECD 가입, 해외여행 자유화"},
            {"year": 1998, "event": "금 모으기 운동, 온 국민이 동참"},
            {"year": 1999, "event": "밀레니엄 카운트다운, PC방 전성기"},
        ],
        "image_prompt_template": (
            "1990s Korean city scene, PC bang (internet cafe), video rental shops, "
            "karaoke rooms (noraebang), pagers (bbibbi), students with backpacks, "
            "neon signs at night, roller skating, X-generation fashion, "
            "warm cartoon illustration style"
        ),
    },
    "2000s": {
        "decade_label": "2000년대",
        "decade_start": 2000,
        "decade_end": 2009,
        "cultural_keywords": [
            "한일 월드컵 (거리 응원 열풍)",
            "싸이월드 미니홈피 꾸미기",
            "초고속 인터넷 (ADSL→광랜)",
            "한류 붐 (겨울연가, 대장금)",
            "MP3 플레이어/아이리버",
            "디지털카메라",
            "스타벅스/카페 문화 시작",
            "토익 열풍",
            "주5일제 시행 (주말 여행)",
            "맛집 탐방",
        ],
        "visual_elements": [
            "피처폰(폴더폰)",
            "MP3 플레이어",
            "미니홈피 화면",
            "붉은악마 응원 티셔츠",
            "카페",
            "DMB 폰",
            "대형마트 장보기",
            "놀이공원 데이트",
        ],
        "historical_events": [
            {"year": 2002, "event": "한일 월드컵, 온 국민 거리 응원"},
            {"year": 2003, "event": "싸이월드 전성기, 도토리 경제"},
            {"year": 2004, "event": "KTX 개통, 서울-부산 2시간 40분"},
            {"year": 2005, "event": "주5일 근무제 확대, 주말 여행 문화"},
            {"year": 2007, "event": "아이폰 등장, 스마트폰 시대 예고"},
        ],
        "image_prompt_template": (
            "2000s Korean modern city, internet cafes, coffee shop culture, "
            "flip phones, MP3 players, Cyworld mini-homepage on monitor, "
            "Red Devils World Cup cheering, early Korean Wave (Hallyu), "
            "warm cartoon illustration style"
        ),
    },
    "2010s": {
        "decade_label": "2010년대",
        "decade_start": 2010,
        "decade_end": 2019,
        "cultural_keywords": [
            "스마트폰 대중화 (카톡 시대)",
            "K-pop 세계화 (BTS, 블랙핑크)",
            "SNS/인스타그램",
            "치킨 배달 (배달의민족)",
            "카카오톡",
            "1인 미디어/유튜버",
            "편의점 도시락",
            "한강 치맥",
            "캠핑 붐",
            "맥주 다양화 (수제맥주)",
        ],
        "visual_elements": [
            "스마트폰 들고 다니는 사람들",
            "카페 거리",
            "지하철에서 스마트폰 보는 풍경",
            "한강공원 치맥",
            "셀카봉",
            "배달 오토바이",
            "편의점 앞 테이블",
            "공유 자전거",
        ],
        "historical_events": [
            {"year": 2012, "event": "싸이 강남스타일 열풍, 유튜브 10억뷰"},
            {"year": 2014, "event": "카카오택시 출시, 배달앱 대중화"},
            {"year": 2016, "event": "알파고 vs 이세돌 대국"},
            {"year": 2018, "event": "평창 동계올림픽, BTS 빌보드 1위"},
            {"year": 2019, "event": "기생충 아카데미상, 한국 영화 역사"},
        ],
        "image_prompt_template": (
            "2010s Korean modern life, smartphones everywhere, trendy cafe streets, "
            "subway commuters, Han River park picnic, selfie sticks, "
            "K-pop concert atmosphere, food delivery scooters, "
            "warm cartoon illustration style"
        ),
    },
    "2020s": {
        "decade_label": "2020년대",
        "decade_start": 2020,
        "decade_end": 2029,
        "cultural_keywords": [
            "코로나19 (마스크 일상화)",
            "재택근무/원격수업",
            "배달앱 전성시대",
            "넷플릭스/OTT 구독",
            "AI/챗GPT",
            "오징어 게임 글로벌 흥행",
            "숏폼 콘텐츠 (릴스, 숏츠)",
            "무인매장/키오스크",
            "러닝 크루/건강 관심",
            "반려동물 가족",
        ],
        "visual_elements": [
            "마스크 착용",
            "배달 오토바이",
            "화상회의 노트북",
            "키오스크 주문",
            "전동킥보드",
            "무인매장",
            "에어팟/무선 이어폰",
            "카페 노트북 작업",
            "한강 러닝",
            "반려견 산책",
        ],
        "historical_events": [
            {"year": 2020, "event": "코로나19 시작, 집콕 생활과 배달앱 폭발 성장"},
            {"year": 2021, "event": "오징어 게임 넷플릭스 세계 1위, 백신 접종 시작"},
            {"year": 2022, "event": "위드코로나 전환, 여행·외식 일상 회복"},
            {"year": 2023, "event": "챗GPT 열풍, 누구나 AI를 쓰기 시작"},
            {"year": 2024, "event": "AI 일상화, 1인 미디어 전성기"},
            {"year": 2025, "event": "AI 에이전트 시대, 1인 가구 40% 돌파"},
        ],
        "image_prompt_template": (
            "2020s Korean daily life, people wearing masks, delivery motorcycles, "
            "video conference on laptop, kiosk ordering, electric scooters, "
            "unmanned stores, streaming on tablet, AI technology era, "
            "warm cartoon illustration style"
        ),
    },
}


def get_era_decade(birth_year: int, era: str) -> str:
    """생년 + 시기 → 해당하는 decade 키 반환 (예: '1990s').

    Args:
        birth_year: 사용자 출생 연도 (예: 1975)
        era: 시기 구분 문자열 (예: '10대', '20대', '60대 이상')

    Returns:
        decade key like '1990s'
    """
    era_clean = era.replace("대 이상", "").replace("대", "").strip()
    era_num = int(era_clean)
    year_start = birth_year + era_num
    decade = f"{(year_start // 10) * 10}s"
    return decade


def get_era_context(birth_year: int, era: str) -> dict:
    """사용자 생년 + 시기 → 해당 시대 연도 + 컨텍스트 반환.

    Args:
        birth_year: 사용자 출생 연도 (예: 1975)
        era: 시기 구분 문자열 (예: '10대', '20대')

    Returns:
        dict with era_data + calculated year_start, year_end, decade
    """
    era_clean = era.replace("대 이상", "").replace("대", "").strip()
    era_num = int(era_clean)
    year_start = birth_year + era_num
    year_end = year_start + 9

    decade = f"{(year_start // 10) * 10}s"
    era_data = ERA_DATABASE.get(decade)

    if era_data is None:
        # Fallback: if the decade is outside our database range, use closest
        all_decades = sorted(ERA_DATABASE.keys())
        if decade < all_decades[0]:
            era_data = ERA_DATABASE[all_decades[0]]
            decade = all_decades[0]
        else:
            era_data = ERA_DATABASE[all_decades[-1]]
            decade = all_decades[-1]

    return {
        "decade": decade,
        "year_start": year_start,
        "year_end": year_end,
        **era_data,
    }
