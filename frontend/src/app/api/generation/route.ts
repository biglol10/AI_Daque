// Design Ref: §4.1 — BFF Proxy: generation endpoints (JWT 토큰 전달)
import { NextRequest } from "next/server";
import { proxyToFastAPI } from "@/lib/bff-proxy";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, ...payload } = body;

  return proxyToFastAPI(request, {
    action,
    payload,
    endpointMap: {
      character: "/api/v1/generate/character",
      background: "/api/v1/generate/background",
      assets: { path: `/api/v1/generate/${payload.project_id}/assets`, method: "GET" },
    },
  });
}
