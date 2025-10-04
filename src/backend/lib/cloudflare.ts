import { env } from "@/env";
import { Cloudflare } from "cloudflare";
import { headers } from "next/headers";

export const cloudflare = new Cloudflare({
  apiToken: env.SAFE_CLOUDFLARE_API_TOKEN,
});

export async function validateTurnstileUsingNextApis(turnstileToken: string) {
  try {
    const reqHeaders = await headers();
    const ip =
      reqHeaders.get("CF-Connecting-IP") ||
      reqHeaders.get("X-Forwarded-For") ||
      "unknown";

    const formData = new FormData();
    formData.append("secret", env.TURNSTILE_SECRET_KEY);
    formData.append("response", turnstileToken);
    formData.append("remoteip", ip);

    const turnstileResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
      }
    );
    const turnstileResult = (await turnstileResponse.json()) as {
      success: boolean;
    };

    console.log(turnstileResult);

    return turnstileResult.success;
  } catch (err) {
    console.error(err);
    return false;
  }
}
