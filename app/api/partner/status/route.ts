import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getActiveCoupleLink } from "@/lib/partnerLink";

export async function GET() {
  try {
    const user = await requireUser();
    const link = await getActiveCoupleLink(user.id);

    if (!link) {
      return NextResponse.json({ linked: false });
    }

    const partnerId = link.userAId === user.id ? link.userBId : link.userAId;
    const partner = partnerId ? await prisma.user.findUnique({ where: { id: partnerId }, select: { nick: true } }) : null;

    return NextResponse.json({
      linked: true,
      partnerNick: partner?.nick ?? null,
      linkedAt: link.linkedAt,
    });
  } catch (err: any) {
    if (err?.status === 401) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
    console.error("Partner status error:", err);
    return NextResponse.json({ error: "Błąd serwera." }, { status: 500 });
  }
}
