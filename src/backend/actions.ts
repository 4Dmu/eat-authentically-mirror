"use server";
import { env } from "@/env";
import { waitlistRegisterRatelimit } from "./lib/rate-limit";
import { resend } from "./lib/resend";
import { actionClient } from "./safe-action";
import { waitlistRegisterArgs } from "./validators";

export const waitlistRegister = actionClient
  .name("waitlistRegister")
  .input(waitlistRegisterArgs)
  .action(async ({ input: { email } }) => {
    const { success } =
      await waitlistRegisterRatelimit.limit("waitlistRegister");

    if (!success) {
      throw new Error("Ratelimit exceeded");
    }

    const result = await resend.contacts.create({
      email: email,
      unsubscribed: false,
      audienceId: env.RESEND_WAITLIST_AUDIENCE_ID,
    });

    console.log(result);
  });
