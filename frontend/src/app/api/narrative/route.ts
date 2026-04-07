// Design Ref: §4.1 — BFF Proxy: narrative endpoints (JWT 토큰 전달)
import { NextRequest } from "next/server";
import { proxyToFastAPI } from "@/lib/bff-proxy";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, ...payload } = body;

  return proxyToFastAPI(request, {
    action,
    payload,
    endpointMap: {
      structure: "/api/v1/narrative/structure",
      script: "/api/v1/narrative/script",
    },
  });
}
