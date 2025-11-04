import { env } from "@/env";
import { Cloudflare } from "cloudflare";

export const cloudflare = new Cloudflare({
  apiToken: env.SAFE_CLOUDFLARE_API_TOKEN,
});
