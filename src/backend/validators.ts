import { type } from "arktype";

export const waitlistRegisterArgs = type({
  email: type("string.email").configure({
    message: "please provide a valid email",
  }),
});
