import { VERCEL_CRON } from "@ea/kv";

export async function GET(request: Request) {
  console.log(request);
  console.log("Cron Handled");

  const ran = await VERCEL_CRON.getRan();

  if (ran) {
    console.log("cron already ran");
    return new Response("Handled");
  }

  await VERCEL_CRON.setRan();
  console.log("Running cron");

  return new Response("Handled");
}
