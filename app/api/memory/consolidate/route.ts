import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { findDuplicateMerges } from "@/lib/ai/memoryConsolidation";
import { GeminiConfigError, GeminiRateLimitError, GeminiAPIError } from "@/lib/ai/client";

// Analiza wielu wpisów naraz przez AI może potrzebować więcej niż domyślne 10s.
export const maxDuration = 60;

export async function POST() {
  try {
    const user = await requireUser();

    const memories = await prisma.memory.findMany({
      where: { userId: user.id, archived: false },
      select: { id: true, subject: true, content: true, shareStatus: true, userConfirmed: true },
      orderBy: { createdAt: "desc" },
      take: 150,
    });

    if (memories.length < 2) {
      return NextResponse.json({ merged: 0, message: "Za mało wpisów, żeby szukać duplikatów." });
    }

    const merges = await findDuplicateMerges(memories.map((m) => ({ id: m.id, subject: m.subject, content: m.content })));

    if (merges.length === 0) {
      return NextResponse.json({ merged: 0, message: "Nie znaleziono duplikatów — Twoja pamięć wygląda czysto." });
    }

    const byId = new Map(memories.map((m) => [m.id, m]));
    let mergedCount = 0;

    for (const merge of merges) {
      const validIds = merge.ids.filter((id) => byId.has(id));
      if (validIds.length < 2) continue;

      // Zachowaj wpis, który już był udostępniony partnerowi (żeby nie zerwać
      // udostępnienia), w drugiej kolejności ten ręcznie potwierdzony przez
      // użytkownika, a w ostatniej — po prostu pierwszy z grupy.
      const keepId =
        validIds.find((id) => byId.get(id)!.shareStatus === "APPROVED") ??
        validIds.find((id) => byId.get(id)!.userConfirmed) ??
        validIds[0];
      const removeIds = validIds.filter((id) => id !== keepId);

      await prisma.memory.update({
        where: { id: keepId },
        data: { content: merge.mergedContent },
      });
      const deleted = await prisma.memory.deleteMany({ where: { id: { in: removeIds }, userId: user.id } });
      mergedCount += deleted.count;
    }

    return NextResponse.json({ merged: mergedCount });
  } catch (err: any) {
    if (err?.status === 401) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
    console.error("Memory consolidation error:", err);
    if (err instanceof GeminiConfigError) return NextResponse.json({ error: err.message }, { status: 503 });
    if (err instanceof GeminiRateLimitError) return NextResponse.json({ error: err.message }, { status: 429 });
    if (err instanceof GeminiAPIError) return NextResponse.json({ error: "Funkcja jest chwilowo niedostępna." }, { status: 502 });
    return NextResponse.json({ error: "Nie udało się połączyć duplikatów." }, { status: 500 });
  }
}
