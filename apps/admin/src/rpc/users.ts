"use server";
import { authenticatedActionClient } from "./helpers/middleware";
import { type } from "arktype";
import { clerk } from "@/lib/clerk";
import { UserJSON } from "@clerk/backend";

export const get = authenticatedActionClient
  .name("users.get")
  .input(type({ userId: "string" }))
  .action(async ({ input: { userId } }) => {
    const user = await clerk.users.getUser(userId);

    return user.raw;
  });
