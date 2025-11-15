import { USER_COUNT_KV, USER_DATA_KV, USER_DELETED_COUNT_KV } from "@ea/kv";
import { logger } from "@/backend/lib/log";
import { env } from "@/env";
import { verifyWebhook } from "@clerk/backend/webhooks";

export async function POST(req: Request) {
  try {
    // const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
    const evt = await verifyWebhook(req, {
      signingSecret: env.CLERK_SIGNING_SECRET,
    });
    logger.info("[CLERK HOOK] handling started");

    try {
      switch (evt.type) {
        case "user.created":
          await USER_COUNT_KV.increment();
          await USER_DATA_KV.set(evt.data);
          logger.info("[CLERK HOOK] handling finished", { type: evt.type });
          break;

        case "user.updated":
          await USER_DATA_KV.set(evt.data);
          logger.info("[CLERK HOOK] handling finished", { type: evt.type });
          break;

        case "user.deleted":
          if (!evt.data.id) {
            logger.info("[CLERK HOOK] Delete event missing id - Ignoring");
            logger.info("[CLERK HOOK] Handling finished", {
              type: evt.type,
            });
            break;
          }
          await USER_DATA_KV.delete(evt.data.id);
          await USER_COUNT_KV.decrement();
          await USER_DELETED_COUNT_KV.increment();
          logger.info("[CLERK HOOK] Handling finished", { type: evt.type });
          break;
        default:
          logger.warn("CLERK HOOK] Unexpected type", { type: evt.type });
          break;
      }
    } catch (err) {
      logger.error("[CLERK HOOK] Internal error", { error: err });
    }

    return Response.json({ message: "Webhook handled succesfully" });
  } catch (err) {
    logger.error("[CLERK HOOK] Verification failed", { error: err });
    return new Response("Webhook verification failed", { status: 400 });
  }
}
