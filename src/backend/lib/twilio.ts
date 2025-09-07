import { env } from "@/env";
import sdk from "twilio";

export const client = sdk(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
