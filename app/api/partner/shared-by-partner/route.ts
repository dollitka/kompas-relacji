import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getActivePartnerId } from "@/lib/partnerLink";

export async function GET() {
  try {
    const user = await requireUser();
    const partnerId = await getActivePartnerId(user.id);
    if (!partnerId) return NextResponse.json({ shared: [] });

    const shared = await prisma.memory.findMany({
      where: { userId: partnerId, shareStatus: "APPROVED", archived: false, subject: "RELATIONSHIP" },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ shared });
  } catch (err: any) {
    if (err?.status === 401) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
    console.error("List shared-by-partner error:", err);
    return NextResponse.json({ error: "Błąd serwera." }, { status: 500 });
  }
}
