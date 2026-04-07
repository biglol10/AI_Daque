// Sentry 클라이언트 설정 (브라우저에서 실행)
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 성능 모니터링: 10% 샘플링 (트래픽 많아지면 낮추기)
  tracesSampleRate: 0.1,

  // 세션 리플레이: 에러 발생 시에만 녹화
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0,

  // 개발 환경에서는 콘솔 에러도 전송하지 않음
  debug: false,

  environment: process.env.NODE_ENV,
});
