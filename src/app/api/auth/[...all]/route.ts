import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const handler = toNextJsHandler(auth);

// Endpoints blocked from public access (users created by admin only)
const BLOCKED_PATHS = new Set(["/sign-up/email"]);

// Rate-limited auth endpoints
const RATE_LIMITED_PATHS = new Set([
  "/sign-in/email",
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

  // Block self-registration — only admins can create users via server actions
  if (BLOCKED_PATHS.has(authPath)) {
    return NextResponse.json(
      { error: "Les inscriptions sont desactivees. Contactez un administrateur." },
      { status: 403 },
    );
  }

  if (RATE_LIMITED_PATHS.has(authPath)) {
    const ip = getClientIp(request);
    // 5 attempts per minute for login, 3 per minute for password reset
    const limit = authPath === "/request-password-reset" ? 3 : 5;
    const result = await checkRateLimit(`auth:${ip}:${authPath}`, limit, 60_000);
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
