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
  limiter: Ratelimit.slidingWindow(2, "1m"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: "@upstash/billing-portal-rate-limit",
});
