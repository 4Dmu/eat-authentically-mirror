import type { NDaysAnalytics } from "@ea/kv";

export type ProducerProfileAnalyticsHelper<TKey extends string> = {
  [key in TKey]: NDaysAnalytics;
};
