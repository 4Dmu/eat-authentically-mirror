"use server";
import { getValidClaimInvitationByToken } from "../data/claim-invitations";
import { clerk, clerkApiErrorResponse } from "../lib/clerk";
import { submitAccountDetailsForClaimInvitationArgs } from "../validators/claim-invitations";
import { actionClient } from "./helpers/safe-action";
import zxcvbn from "zxcvbn";
import { db } from "../db";
import { claimInvitations, producers } from "../db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { logger } from "../lib/log";
import { type } from "arktype";
import {
  allow1RequestsPer1Second,
  allow20RequestsPer1Second,
  clerkRatelimit,
  multiLimit,
} from "../lib/rate-limit";

export const submitAccountDetailsForClaimInvitation = actionClient
  .input(submitAccountDetailsForClaimInvitationArgs)
  .action(async ({ input: { accountDetails, token } }) => {
    const success = await multiLimit([
      [clerkRatelimit, "*"],
      [allow20RequestsPer1Second, "submitAccountDetailsForClaimInvitation"],
      [allow1RequestsPer1Second, token],
    ]);

    if (!success) {
      throw new Error("Ratelimit exceeded");
    }

    const session = await auth();

    if (session.userId) {
      return {
        status: "error",
        message: "Must not be logged in",
      } as const;
    }

    const claim = await getValidClaimInvitationByToken(token);

    if (!claim) {
      return {
        status: "error",
        message: "Invalid claim token",
      } as const;
    }

    const zxcvbnResult = zxcvbn(accountDetails.password);

    if (zxcvbnResult.score <= 2) {
      return {
        status: "error",
        passwordError: zxcvbnResult.feedback,
      } as const;
    }

    try {
      const user = await clerk.users.createUser({
        firstName: accountDetails.firstName,
        lastName: accountDetails.lastName,
        emailAddress: [accountDetails.email],
        password: accountDetails.password,
      });

      logger.info(`created user: ${user.id}`);

      await db
        .update(producers)
        .set({ userId: user.id, claimed: true, updatedAt: new Date() })
        .where(eq(producers.id, claim.producerId));

      await db
        .update(claimInvitations)
        .set({
          status: {
            type: "claimed",
          },
          claimedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(claimInvitations.id, claim.id));

      const signInToken = await clerk.signInTokens.createSignInToken({
        userId: user.id,
        expiresInSeconds: 60 * 3, // 3 minutes
      });

      logger.info(`created sign-in token`, {
        userId: signInToken.userId,
        tokenId: signInToken.id,
      });

      return {
        status: "success",
        signInToken: signInToken.token,
      } as const;
    } catch (err) {
      const error = clerkApiErrorResponse(err);

      if (error instanceof type.errors) {
        logger.error("Error creating user", { error: err });
        return {
          status: "error",
          message: "Error creating user",
        } as const;
      }

      logger.error("Error creating user", { error: error });

      const formError = error.errors.find((err) =>
        err.code.startsWith("form_")
      );

      if (formError) {
        return {
          status: "error",
          message: formError.longMessage,
        } as const;
      }

      return {
        status: "error",
        message: "Error creating user",
      } as const;
    }
  });
