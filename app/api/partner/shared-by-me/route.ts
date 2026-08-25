import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await requireUser();
    const shared = await prisma.memory.findMany({
      where: { userId: user.id, shareStatus: "APPROVED", archived: false },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ shared });
  } catch (err: any) {
    if (err?.status === 401) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
    console.error("List shared-by-me error:", err);
    return NextResponse.json({ error: "Błąd serwera." }, { status: 500 });
  }
}
