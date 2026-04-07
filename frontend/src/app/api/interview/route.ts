// Design Ref: §4.1 — BFF Proxy: interview endpoints (JWT 토큰 전달)
import { NextRequest } from "next/server";
import { proxyToFastAPI } from "@/lib/bff-proxy";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, ...payload } = body;

  return proxyToFastAPI(request, {
    action,
    payload,
    endpointMap: {
      start: "/api/v1/interview/start",
      message: "/api/v1/interview/message",
      complete: `/api/v1/interview/${payload.interview_id}/complete`,
    },
  });
}
