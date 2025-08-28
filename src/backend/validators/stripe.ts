import { type } from "arktype";

export const TimeframeValidator = type("'month'|'year'");
export const TierValidator = type("'community'|'pro'|'premium'|'enterprise'");

export const CreateCheckoutSessionArgsValidator = type({
  timeframe: TimeframeValidator,
  tier: TierValidator,
});

export type CreateCheckoutSessionArgs =
  typeof CreateCheckoutSessionArgsValidator.infer;
