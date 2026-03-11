import { prisma } from "@/lib/prisma";

/**
 * Database-backed rate limiter — works on Vercel serverless.
 * Uses the RateLimit table for persistent state across invocations.
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<{ allowed: true } | { allowed: false; retryAfter: number }> {
  const now = new Date();

  // Clean expired entries occasionally (1 in 10 chance to avoid every-request overhead)
  if (Math.random() < 0.1) {
    await prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: now } } }).catch(() => {});
  }

  const existing = await prisma.rateLimit.findUnique({ where: { key } });

  // No entry or expired — create fresh
  if (!existing || existing.expiresAt <= now) {
    await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, expiresAt: new Date(now.getTime() + windowMs) },
      update: { count: 1, expiresAt: new Date(now.getTime() + windowMs) },
    });
    return { allowed: true };
  }

  // Over limit
  if (existing.count >= maxRequests) {
    const retryAfter = Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment
  await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });

  return { allowed: true };
}
