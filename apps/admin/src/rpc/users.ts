"use server";
import { type } from "arktype";
import { clerk } from "@/lib/clerk";
import { authenticatedActionClient } from "./helpers/middleware";

export const get = authenticatedActionClient
  .name("users.get")
  .input(type({ userId: "string" }))
  .action(async ({ input: { userId } }) => {
    const user = await clerk.users.getUser(userId);

    return user.raw;
  });
