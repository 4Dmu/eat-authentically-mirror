import { createEnv } from "@t3-oss/env-nextjs";
import { type } from "arktype";

export const env = createEnv({
  server: {
    TURSO_DB_URL: type("string > 1"),
    TURSO_DB_TOKEN: type("string > 1"),
    UPSTASH_REDIS_REST_URL: type("string > 1"),
    UPSTASH_REDIS_REST_TOKEN: type("string > 1"),
    SITE_URL: type("string.url"),

    CLERK_SECRET_KEY: type("string > 1"),
    CLERK_SIGN_IN_URL: type("string > 1"),
    CLERK_SIGN_UP_URL: type("string > 1"),
    STRIPE_SECRET_KEY: type("string > 1"),

    TOTAL_GEOCODE_REQUESTS_ALLOWED: type("string.numeric.parse"),
    PRODUCER_PRO_MONTLY_PRICE_ID: type("string > 1"),
    PRODUCER_PRO_YEARLY_PRICE_ID: type("string > 1"),
    PRODUCER_PREMIUM_MONTLY_PRICE_ID: type("string > 1"),
    PRODUCER_PREMIUM_YEARLY_PRICE_ID: type("string > 1"),
    COMMUNITY_MEMBER_MONTLY_PRICE_ID: type("string > 1"),
  },
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: type("string > 1"),
    NEXT_PUBLIC_GOOGLE_MAPS_JS_PUBLIC_KEY: type("string > 1"),
  },
  // For Next.js >= 13.4.4, you only need to destructure client variables:
  experimental__runtimeEnv: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_JS_PUBLIC_KEY:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_JS_PUBLIC_KEY,
  },
});
