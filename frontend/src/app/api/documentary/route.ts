// Design Ref: §4.1 — BFF Proxy: documentary endpoints (JWT 토큰 전달)
import { NextRequest } from "next/server";
import { proxyToFastAPI } from "@/lib/bff-proxy";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, ...payload } = body;

  return proxyToFastAPI(request, {
    action,
    payload,
    endpointMap: {
      compose: "/api/v1/documentary/compose",
      status: { path: `/api/v1/documentary/status/${payload.task_id}`, method: "GET" },
      download: { path: `/api/v1/documentary/${payload.project_id}/download`, method: "GET" },
    },
  });
}
