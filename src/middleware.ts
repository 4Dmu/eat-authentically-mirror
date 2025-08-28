import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { getSubTier } from "./backend/rpc/utils/get-sub-tier";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/listing(.*)",
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhook(.*)",
  "/about",
]);

const isSubRoute = createRouteMatcher(["/dashboard/subscribe"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  if (isSubRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
    const tier = await getSubTier(userId);
    if (tier !== "Free") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
