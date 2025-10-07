import { logger } from "@/backend/lib/log";
import { client } from "@/backend/lib/twilio";
import { env } from "@/env";

export async function sendClaimCodeMessage(phone: string, token: string) {
  const result = await client.messages.create({
    body: `EatAuthentically claim your producer code: ${token}`,
    from: env.TWILIO_NUMBER,
    to: phone,
  });
  logger.info("Send claim code message result", { result });
}
