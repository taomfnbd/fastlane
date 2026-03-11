import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const handler = toNextJsHandler(auth);

// Rate-limited auth endpoints (login, signup, forgot-password)
const RATE_LIMITED_PATHS = new Set([
  "/sign-in/email",
  "/sign-up/email",
  "/request-password-reset",
]);

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function GET(request: NextRequest) {
  return handler.GET(request);
}

export async function POST(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authPath = pathname.replace("/api/auth", "");

  if (RATE_LIMITED_PATHS.has(authPath)) {
    const ip = getClientIp(request);
    const result = checkRateLimit(`auth:${ip}:${authPath}`, 5, 60_000);
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Reessayez plus tard." },
        {
          status: 429,
          headers: { "Retry-After": String(result.retryAfter) },
        },
      );
    }
  }

  return handler.POST(request);
}
