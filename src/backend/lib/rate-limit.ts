import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

export const videoRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(1, "1m"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: "@upstash/video-rate-limit",
});

export const billingPortalRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "1m"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: "@upstash/billing-portal-rate-limit",
});

export const producerClaimDnsCheckRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(1, "2m"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: "@upstash/producer-claim-dns-rate-limit",
});

export const claimProducerRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(1, "1m"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: "@upstash/claim-producer-rate-limit",
});

export const producerClaimVerifyPhoneRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(1, "10s"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: "@upstash/producer-claim-verify-phone-rate-limit",
});

export const messageRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(3, "10s"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: "@upstash/message-rate-limit",
});

export const suggestProducerFreeLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(1, "1d"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: "@upstash/suggest-producer-free-limit",
});

export const suggestProducerProLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(3, "1d"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: "@upstash/suggest-producer-pro-limit",
});

export const geocodeRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(90000, "32d"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: "@upstash/geocode-limit",
});

export const clerkRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(
    process.env.NODE_ENV === "development" ? 50 : 800,
    "10s"
  ),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: "@upstash/clerk-limit",
});

export const allow20RequestsPer1Second = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(20, "1s"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: "@upstash/submit-claim-invitation-account-details",
});

export const allow1RequestsPer1Second = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(1, "1s"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: "@upstash/submit-claim-invitation-account-details",
});

export const allow1RequestPer2Seconds = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(1, "2 s"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: "ea-concierge:1req-per-2sec",
});

export const allow10RequestPer30Minutes = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "30 m"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: "ea-concierge:10req-per-30min",
});

export const allow25RequestPer30Min = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(25, "30 m"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: "ea-concierge:25req-per-30min",
});

export const allow100RequestPer30Min = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, "30 m"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: "ea-concierge:100req-per-30min",
});

export async function multiLimit(limits: [Ratelimit, string][]) {
  for (const [limit, key] of limits) {
    const result = await limit.limit(key);

    if (result.success) {
      continue;
    }

    return false;
  }

  return true;
}
