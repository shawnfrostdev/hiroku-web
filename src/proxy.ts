import arcjet, { detectBot, tokenBucket } from "@arcjet/next";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Configure Arcjet
const aj = arcjet({
  key: process.env.ARCJET_KEY || "",
  characteristics: ["ip.src"], // Rate limit by client IP
  rules: [
    // Bot protection to block spam scraping
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"], // Allow Search engines for SEO
    }),
    // Rate limiter (20 requests capacity, refills 10 every 10 seconds)
    tokenBucket({
      mode: "LIVE",
      refillRate: 10,
      interval: 10,
      capacity: 20,
    }),
  ],
});

const isProtectedRoute = createRouteMatcher([
  "/watchlist(.*)",
  "/comments(.*)",
]);

export const proxy = clerkMiddleware(async (auth, req) => {
  // If ARCJET_KEY is not defined, we skip checks during local setup to avoid breaking development
  if (process.env.ARCJET_KEY) {
    try {
      const decision = await aj.protect(req, { requested: 1 });
      if (decision.isDenied()) {
        if (decision.reason.isRateLimit()) {
          return new NextResponse("Too Many Requests", { status: 429 });
        }
        return new NextResponse("Access Denied", { status: 403 });
      }
    } catch (e) {
      console.error("Arcjet shield error:", e);
    }
  }

  // Handle Clerk route protection
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
