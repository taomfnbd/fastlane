import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isAdmin } from "@/lib/auth-server";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["DRAFT", "PREPARATION", "ACTIVE", "REVIEW", "COMPLETED", "ARCHIVED"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = statusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { eventId } = await params;

  await prisma.event.update({
    where: { id: eventId },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ success: true });
}
