import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

/** Wpisy pamięci użytkownika czekające na jego decyzję (udostępnić partnerowi czy nie). */
export async function GET() {
  try {
    const user = await requireUser();
    const pending = await prisma.memory.findMany({
      where: { userId: user.id, shareStatus: "PENDING", archived: false },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ pending });
  } catch (err: any) {
    if (err?.status === 401) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
    console.error("List pending shares error:", err);
    return NextResponse.json({ error: "Błąd serwera." }, { status: 500 });
  }
}
