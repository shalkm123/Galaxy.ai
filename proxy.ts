import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/login(.*)",
]);

const isSelfAuthorizedApiRoute = createRouteMatcher([
  "/api/media(.*)",
]);

function isInternalExecutionRequest(req: NextRequest) {
  const expectedKey = process.env.INTERNAL_EXECUTION_KEY;
  const providedKey = req.headers.get("x-internal-execution-key");

  return Boolean(expectedKey && providedKey && providedKey === expectedKey);
}

export default clerkMiddleware(async (auth, req) => {
  if (
    isPublicRoute(req) ||
    isSelfAuthorizedApiRoute(req) ||
    isInternalExecutionRequest(req)
  ) {
    return;
  }

  await auth.protect({
    unauthenticatedUrl: new URL("/login", req.url).toString(),
  });
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
