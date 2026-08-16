import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await requireUser();
    const memories = await prisma.memory.findMany({
      where: { userId: user.id, archived: false },
      orderBy: [{ subject: "asc" }, { importance: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ memories });
  } catch (err: any) {
    if (err?.status === 401) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
    console.error("List memory error:", err);
    return NextResponse.json({ error: "Błąd serwera." }, { status: 500 });
  }
}

/** Czyści CAŁĄ pamięć użytkownika (sekcja "Wyczyść pamięć" w ustawieniach). */
export async function DELETE() {
  try {
    const user = await requireUser();
    await prisma.memory.deleteMany({ where: { userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.status === 401) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
    console.error("Clear memory error:", err);
    return NextResponse.json({ error: "Nie udało się wyczyścić pamięci." }, { status: 500 });
  }
}
