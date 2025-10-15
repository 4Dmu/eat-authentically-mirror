import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    TURSO_DB_URL: z.string().min(1),
    TURSO_DB_TOKEN: z.string().min(1),

    NEW_TURSO_DB_URL: z.string().min(1),
    NEW_TURSO_DB_TOKEN: z.string().min(1),

    UPSTASH_REDIS_REST_URL: z.string().min(1),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

    SITE_URL: z.url().min(1),

    CLERK_SECRET_KEY: z.string().min(1),
    CLERK_SIGNING_SECRET: z.string().min(1),

    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_SIGNING_SECRET: z.string().min(1),

    TOTAL_GEOCODE_REQUESTS_ALLOWED: z.coerce.number().min(0),

    ORGANIZATION_PRO_MONTHLY_PRICE_ID: z.string().min(1),
    ORGANIZATION_PRO_YEARLY_PRICE_ID: z.string().min(1),
    ORGANIZATION_PREMIUM_MONTHLY_PRICE_ID: z.string().min(1),
    ORGANIZATION_PREMIUM_YEARLY_PRICE_ID: z.string().min(1),

    PRODUCER_ENTERPRISE_MONTHLY_PRICE_ID: z.string().min(1),
    PRODUCER_ENTERPRISE_YEARLY_PRICE_ID: z.string().min(1),

    COMMUNITY_MEMBER_MONTHLY_PRICE_ID: z.string().min(1),
    COMMUNITY_MEMBER_YEARLY_PRICE_ID: z.string().min(1),
    SAFE_CLOUDFLARE_API_TOKEN: z.string().min(1),
    SAFE_CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
    SAFE_CLOUDFLARE_ACCOUNT_HASH: z.string().min(1),

    STREAM_WEBHOOK_SECRET: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    RESEND_FROM_EMAIL: z.string().min(1),

    TWILIO_ACCOUNT_SID: z.string().min(1),
    TWILIO_AUTH_TOKEN: z.string().min(1),
    TWILIO_NUMBER: z.string().min(1),

    GOOGLE_MAPS_API_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_GOOGLE_MAPS_JS_PUBLIC_KEY: z.string().min(1),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().min(1),
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().min(1),
    NEXT_PUBLIC_AXIOM_TOKEN: z.string().min(1),
    NEXT_PUBLIC_AXIOM_DATASET: z.string().min(1),
  },
  // For Next.js >= 13.4.4, you only need to destructure client variables:
  experimental__runtimeEnv: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_JS_PUBLIC_KEY:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_JS_PUBLIC_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_AXIOM_TOKEN: process.env.NEXT_PUBLIC_AXIOM_TOKEN,
    NEXT_PUBLIC_AXIOM_DATASET: process.env.NEXT_PUBLIC_AXIOM_DATASET,
  },
});
