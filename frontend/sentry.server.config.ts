// Sentry 서버 설정 (Next.js 서버 컴포넌트, API Routes에서 실행)
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 0.1,
  debug: false,
  environment: process.env.NODE_ENV,
});
