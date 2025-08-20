import {
  USER_COUNT_KV,
  USER_DATA_KV,
  USER_DELETED_COUNT_KV,
} from "@/backend/kv";
import { env } from "@/env";
import { verifyWebhook } from "@clerk/backend/webhooks";

export async function POST(req: Request) {
  try {
    // const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
    const evt = await verifyWebhook(req, {
      signingSecret: env.CLERK_SIGNING_SECRET,
    });
    console.log("[CLERK HOOK] handling started");

    try {
      switch (evt.type) {
        case "user.created":
          await USER_COUNT_KV.increment();
          await USER_DATA_KV.set(evt.data);
          console.log("[CLERK HOOK] handling finished - type:", evt.type);
          break;

        case "user.updated":
          await USER_DATA_KV.set(evt.data);
          console.log("[CLERK HOOK] handling finished - type:", evt.type);
          break;

        case "user.deleted":
          if (!evt.data.id) {
            console.log("[CLERK HOOK] Delete event missing id - Ignoring");
            console.log("[CLERK HOOK] Handling finished - type:", evt.type);
            break;
          }
          await USER_DATA_KV.delete(evt.data.id);
          await USER_COUNT_KV.decrement();
          await USER_DELETED_COUNT_KV.increment();
          console.log("[CLERK HOOK] Handling finished - type:", evt.type);
          break;
        default:
          console.warn("CLERK HOOK] Unexpected type - type:", evt.type);
          break;
      }
    } catch (err) {
      console.error("[CLERK HOOK] Internal error - error: ", err);
    }

    return Response.json({ message: "Webhook handled succesfully" });
  } catch (err) {
    console.error("[CLERK HOOK] Verification failed - error:", err);
    return new Response("Webhook verification failed", { status: 400 });
  }
}
