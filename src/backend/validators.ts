import { type } from "arktype";
import { isMobilePhone } from "validator";

export const waitlistRegisterArgs = type({
  email: type("string.email").configure({
    message: "please provide a valid email",
  }),
});

export const submitListingArgs = type({
  name: type.string.atLeastLength(3).atMostLength(250).configure({
    message: "please provide a name longer then 3 characters",
  }),
  email: type("string.email").configure({
    message: "please provide a valid email",
  }),
  phone: type("string|undefined").narrow((n, ctx) => {
    if (n == undefined) {
      return true;
    }

    if (!isMobilePhone(n)) {
      ctx.mustBe("a valid phone number including country code");
      return false;
    }

    return true;
  }),
  website: type("string.url|undefined"),
  address: type("string")
    .atLeastLength(3)
    .atMostLength(300)
    .configure({
      actual: () => "",
      message:
        "must be an address in the following format: street, city, state, zip, country",
    }),
  type: "'farm'|'ranch'|'eatery'",
  turnstileToken: type("string").configure({
    message: "please complete the captcha",
  }),
});
