import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const release =
  process.env.SENTRY_RELEASE?.trim() ||
  process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
  "";

const nextConfig: NextConfig = {
  ...(release
    ? {
        env: {
          NEXT_PUBLIC_SENTRY_RELEASE: release,
        },
      }
    : {}),
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
});
