// Design Ref: §4.1 — BFF Proxy: voice endpoints (JWT 토큰 전달)
import { NextRequest } from "next/server";
import { proxyToFastAPI } from "@/lib/bff-proxy";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, ...payload } = body;

  return proxyToFastAPI(request, {
    action,
    payload,
    endpointMap: {
      samples: { path: "/api/v1/voice/samples", method: "GET" },
      clone: "/api/v1/voice/clone",
      consent: "/api/v1/voice/consent",
      tts: "/api/v1/voice/tts",
      preview: "/api/v1/voice/preview",
    },
  });
}
