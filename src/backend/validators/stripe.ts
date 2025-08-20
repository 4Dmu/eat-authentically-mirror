import { type } from "arktype";

export type CreateMemberCheckoutSessionArgs =
  typeof CreateMemberCheckoutSessionArgsValidator.infer;

export const CreateMemberCheckoutSessionArgsValidator = type({
  timeframe: "'monthly'|'yearly'",
});
