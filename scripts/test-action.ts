import { ActionClient } from "@/backend/lib/action-client";
import { tryCatch } from "@/utils/try-catch";
import z from "zod";

const client = new ActionClient();

const action = client.action((ctx) => {
  console.log(ctx);
});

const withUser = client.use(async (ctx) => {
  await new Promise((r) => setTimeout(r, 2000));
  return { user: { name: "bob" } };
});

const withOrg = withUser.use(async (ctx) => {
  await new Promise((r) => setTimeout(r, 2000));
  console.log(ctx, "org-middleware");
  return {
    org: {
      name: "Whole Foods",
    },
  };
});

const orgAction = withOrg.action((ctx) => {
  console.log(ctx);
  return "now";
});

const userAction = withUser
  .input(z.object({ test: z.literal("one") }))
  .action(async (ctx) => {
    console.log(ctx);
    throw new Error();
    return "dan";
  });

async function main() {
  action();
  console.log(await tryCatch(userAction)({ test: "one" }));
  console.log(await orgAction());
}

main();
