// Design Ref: §9 — Error Handling
"use client";

import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

function getErrorMessage(error: unknown): string {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes("401") || message.includes("unauthorized")) {
    return "인증이 만료되었습니다. 다시 로그인해주세요.";
  }
  if (message.includes("403") || message.includes("forbidden")) {
    return "접근 권한이 없습니다.";
  }
  if (message.includes("404") || message.includes("not found")) {
    return "요청한 페이지를 찾을 수 없습니다.";
  }
  if (message.includes("500") || message.includes("server")) {
    return "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "네트워크 연결을 확인해주세요.";
  }

  return "예기치 않은 오류가 발생했습니다.";
}

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: unknown;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
          <AlertTriangle className="size-10 text-destructive" />
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">오류가 발생했습니다</h2>
            <p className="text-sm text-muted-foreground">
              {getErrorMessage(error)}
            </p>
          </div>
          <Button onClick={resetErrorBoundary}>다시 시도</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function AppErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ReactErrorBoundary>
  );
}
