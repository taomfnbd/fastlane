import { NextRequest, NextResponse } from "next/server";
import { checkDeadlines } from "@/lib/deadline-check";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const count = await checkDeadlines();
    return NextResponse.json({ ok: true, reminders: count });
  } catch (error) {
    console.error("[cron/deadlines] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
