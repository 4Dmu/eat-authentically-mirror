import { env } from "@/env";
import { createClerkClient } from "@clerk/backend";
import { type } from "arktype";

export const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

export const meta = type({
  paramName: "string",
});
export type Meta = typeof meta.infer;

export const errorElement = type({
  code: "string",
  message: "string",
  longMessage: "string",
  meta: meta,
});
export type ErrorElement = typeof errorElement.infer;

export const clerkApiErrorResponse = type({
  status: "number",
  clerkTraceId: "string",
  clerkError: "boolean",
  errors: errorElement.array(),
});
export type ClerkApiErrorResponse = typeof clerkApiErrorResponse.infer;
