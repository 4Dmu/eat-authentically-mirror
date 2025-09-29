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
