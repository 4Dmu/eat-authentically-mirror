import { type } from "arktype";

export const submitClaimInvitationAccountDetails = type({
  firstName: type("string").atLeastLength(3).atMostLength(100),
  lastName: type("string").atLeastLength(3).atMostLength(100),
  email: type("string.email"),
  password: type("string").atLeastLength(8),
  confirmPassword: type("string").atLeastLength(8),
}).narrow((value, ctx) => {
  if (value.password !== value.confirmPassword) {
    return ctx.reject({
      message: "password and confirmPassword do not match",
      path: ["confirmPassword"],
    });
  }
  return true;
});

export const submitAccountDetailsForClaimInvitationArgs = type({
  accountDetails: submitClaimInvitationAccountDetails,
  token: "string",
});

export type SubmitClaimInvitationAccountDetails =
  typeof submitClaimInvitationAccountDetails.infer;
