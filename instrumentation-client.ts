import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (!POSTHOG_KEY || !POSTHOG_HOST) {
  throw new Error(
    "Missing NEXT_PUBLIC_POSTHOG_KEY or NEXT_PUBLIC_POSTHOG_HOST in environment variables",
  );
}

posthog.init(POSTHOG_KEY, {
  api_host: POSTHOG_HOST,
  defaults: "2025-05-24",
});
