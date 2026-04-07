import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  // 빌드 시 소스맵 업로드 (Sentry DSN 없으면 스킵)
  silent: true,
  // org/project는 Sentry 대시보드에서 확인
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // DSN 없으면 Sentry 관련 빌드 스킵
  disableLogger: true,
});
