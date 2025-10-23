import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { getSubTier } from "./backend/rpc/utils/get-sub-tier";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { geolocation } from "@vercel/functions";
import { CUSTOM_GEO_HEADER_NAME } from "./backend/constants";

const isPublicRoute = createRouteMatcher([
  "/producers(.*)",
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhook(.*)",
  "/api/notifications(.*)",
  "/api/external(.*)",
  "/about",
  "/claim",
  "/join-and-claim",
  "/sign-in-with-token",
]);

const isSubRoute = createRouteMatcher(["/dashboard/subscribe"]);

const isHome = createRouteMatcher(["/"]);

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  // logger.info(...transformMiddlewareRequest(request));

  // event.waitUntil(logger.flush());

  return await clerkMiddleware(async (auth, req) => {
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

    const response = NextResponse.next();

    if (isHome(req)) {
      const geo = geolocation(req);
      if (process.env.NODE_ENV === "development") {
        geo.latitude = "38.581650486149975";
        geo.longitude = "-121.36493918991683";
      }

      const encodedGeo = Buffer.from(JSON.stringify(geo)).toString("base64");

      response.headers.set(CUSTOM_GEO_HEADER_NAME, encodedGeo);
    }

    return response;
  })(request, event);
}

// export default clerkMiddleware(async (auth, req) => {
//   if (!isPublicRoute(req)) {
//     await auth.protect();
//   }

//   if (isSubRoute(req)) {
//     const { userId } = await auth();
//     if (!userId) {
//       return NextResponse.redirect(new URL("/sign-in", req.url));
//     }
//     const tier = await getSubTier(userId);
//     if (tier !== "Free") {
//       return NextResponse.redirect(new URL("/dashboard", req.url));
//     }
//   }

//   const response = NextResponse.next();

//   if (isHome(req)) {
//     const geo = geolocation(req);
//     if (process.env.NODE_ENV === "development") {
//       geo.latitude = "38.581650486149975";
//       geo.longitude = "-121.36493918991683";
//     }

//     const encodedGeo = Buffer.from(JSON.stringify(geo)).toString("base64");

//     response.headers.set(CUSTOM_GEO_HEADER_NAME, encodedGeo);
//   }

//   return response;
// });

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
