import { Plan } from "./subscription-plans";

export const CLAIM_DNS_TXT_RECORD_NAME = "ea-verify";

export const CUSTOM_GEO_HEADER_NAME = "x-custom-geo";

export const COMMUNITY_TIER_PROS = [
  "Leave detailed reviews for producers.",
  "Send direct messages to producers.",
  "Access exclusive community content.",
  "Priority customer support.",
  "Support sustainable food producers.",
];

export const PRO_TIER_PROS = [
  "Edit basic info: Yes",
  "Add certifications: Up to 6",
  "Add products: Up to 10",
  "Upload hero images: 3 images",
  "Additional images: 2 extra",
  "Featured in listings: Randomized",
  "Receive messages from community members",
];

export const PREMIUM_TIER_PROS = [
  "Edit basic info: Yes",
  "Add certifications: Unlimited",
  "Add products: Unlimited",
  "Upload hero images: 10 images + video",
  "Additional images: Up to 10 total",
  "Featured in listings: Priority slot",
  "Upload video: Yes",
  "Receive messages from community members",
];

export const HOME_PAGE_RESULT_LIMIT = 50;

export const PRODUCER_CERT_LIMIT_BY_TIER: Record<
  "Free" | Plan["tier"],
  number
> = {
  Free: 1,
  community: 1,
  pro: 6,
  premium: 10,
  enterprise: 999, // effectively unlimited
};

export const PRODUCER_PRODUCTS_LIMIT_BY_TIER: Record<
  "Free" | Plan["tier"],
  number
> = {
  Free: 1,
  community: 1,
  pro: 10,
  premium: 999, // effectively unlimited
  enterprise: 999, // effectively unlimited
};

export const RATELIMIT_ALL = "*" as const;

export const PRODUCER_TYPES = ["farm", "ranch", "eatery"] as const;
