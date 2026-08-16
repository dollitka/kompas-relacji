import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

// Usuwa konto użytkownika i WSZYSTKIE powiązane dane (profil, partner, rozmowy,
// wiadomości, pamięć, wzorce, wydarzenia, testy, ustawienia) dzięki
// onDelete: Cascade zdefiniowanemu w schema.prisma.
export async function DELETE() {
  try {
    const user = await requireUser();
    await prisma.user.delete({ where: { id: user.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.status === 401) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
    console.error("Delete account error:", err);
    return NextResponse.json({ error: "Nie udało się usunąć konta." }, { status: 500 });
  }
}
