// BFF proxy for /try endpoints — NO auth required (standalone, does not use bff-proxy.ts)
import { NextRequest, NextResponse } from "next/server";

const AI_BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const ENDPOINT_MAP: Record<string, string> = {
  character: "/api/v1/try/character",
  "mini-interview": "/api/v1/try/mini-interview",
  "mini-documentary": "/api/v1/try/mini-documentary",
};

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청입니다" },
      { status: 400 }
    );
  }

  const { action, ...payload } = body;

  if (typeof action !== "string" || !ENDPOINT_MAP[action]) {
    return NextResponse.json(
      { error: "유효하지 않은 action입니다" },
      { status: 400 }
    );
  }

  const path = ENDPOINT_MAP[action];

  try {
    const res = await fetch(`${AI_BACKEND_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Handle audio responses (e.g. TTS sample)
    if (res.headers.get("content-type")?.includes("audio/")) {
      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, {
        status: res.status,
        headers: {
          "Content-Type": res.headers.get("content-type") || "audio/mpeg",
        },
      });
    }

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "AI 백엔드에 연결할 수 없습니다" },
      { status: 503 }
    );
  }
}
