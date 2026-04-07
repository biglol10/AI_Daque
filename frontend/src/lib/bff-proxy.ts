// BFF 프록시 공통 유틸: Supabase JWT 토큰을 읽어 FastAPI에 전달
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const AI_BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAuthToken(request: NextRequest): Promise<string | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

interface ProxyConfig {
  endpointMap: Record<string, { path: string; method: string } | string>;
  payload: Record<string, unknown>;
  action: string;
}

export async function proxyToFastAPI(
  request: NextRequest,
  config: ProxyConfig
): Promise<NextResponse> {
  const token = await getAuthToken(request);
  if (!token) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const target = config.endpointMap[config.action];
  if (!target) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const path = typeof target === "string" ? target : target.path;
  const method = typeof target === "string" ? "POST" : target.method;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const fetchOptions: RequestInit = { method, headers };
  if (method === "POST") {
    fetchOptions.body = JSON.stringify(config.payload);
  }

  try {
    const res = await fetch(`${AI_BACKEND_URL}${path}`, fetchOptions);

    if (res.headers.get("content-type")?.includes("audio/")) {
      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, {
        status: res.status,
        headers: { "Content-Type": res.headers.get("content-type") || "audio/mpeg" },
      });
    }

    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "AI 백엔드에 연결할 수 없습니다" }, { status: 503 });
  }
}
