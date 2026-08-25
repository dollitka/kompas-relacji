import { getStructuredJSON } from "@/lib/ai/client";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// Analiza wzorców (sekcja 8 specyfikacji): na żądanie użytkownika ("Wzorce w
// naszej relacji" → "Przeanalizuj ponownie") LUB automatycznie w tle co kilka
// wiadomości (patrz recomputePatternsForUser, wołane z app/api/messages/route.ts)
// prosimy AI o spojrzenie na zebrane fakty/interpretacje i historię rozmów, i
// wskazanie POWTARZAJĄCYCH SIĘ schematów — najlepiej z rozbiciem na kroki cyklu
// (np. pursue/withdraw).
// ---------------------------------------------------------------------------

const PATTERN_SYSTEM_PROMPT = `Analizujesz zebrane informacje o związku użytkownika (fakty, interpretacje,
fragmenty rozmów). Twoje zadanie: wskazać POWTARZAJĄCE SIĘ wzorce zachowań lub cykle
konfliktu — czyli coś, co pojawiło się w kilku różnych sytuacjach, a nie jednorazowy
incydent.

Możliwe kategorie wzorców: komunikacja, zazdrość, dystans, potrzeba kontroli, unikanie
rozmów, nadmierne przepraszanie, people pleasing, problemy z granicami, eskalacja
konfliktów, cykl pursue/withdraw, inne.

NIE zakładaj, że każdy wzorzec jest toksyczny — nazywaj go neutralnie, opisowo.
Jeśli materiału jest za mało, żeby cokolwiek wiarygodnie wskazać, zwróć pustą listę —
nie wymyślaj wzorców na siłę.

Odpowiedz WYŁĄCZNIE poprawnym JSON-em, bez markdown, w formacie:
{"patterns": [
  {
    "title": "krótki tytuł wzorca po polsku",
    "description": "2-3 zdania opisujące wzorzec, bez oceniania",
    "category": "komunikacja" | "zazdrość" | "dystans" | "kontrola" | "unikanie" | "nadmierne_przepraszanie" | "people_pleasing" | "granice" | "eskalacja" | "pursue_withdraw" | "inne",
    "cycleSteps": ["krok 1", "krok 2", "krok 3"]
  }
]}
Maksymalnie 5 wzorców. cycleSteps to opcjonalna tablica (0-6 elementów) pokazująca
sekwencję cyklu, jeśli da się ją wyodrębnić — w przeciwnym razie pusta tablica.`;

export type PatternCandidate = {
  title: string;
  description: string;
  category: string;
  cycleSteps: string[];
};

export async function analyzePatterns(contextText: string): Promise<PatternCandidate[]> {
  const raw = await getStructuredJSON(PATTERN_SYSTEM_PROMPT, contextText);
  try {
    const cleaned = raw.replace(/^```json\s*|```$/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed.patterns)) return [];
    return parsed.patterns
      .filter((p: any) => p && typeof p.title === "string" && typeof p.description === "string")
      .slice(0, 5)
      .map((p: any) => ({
        title: String(p.title).slice(0, 120),
        description: String(p.description).slice(0, 600),
        category: typeof p.category === "string" ? p.category : "inne",
        cycleSteps: Array.isArray(p.cycleSteps) ? p.cycleSteps.filter((s: any) => typeof s === "string").slice(0, 6) : [],
      }));
  } catch {
    return [];
  }
}

const MIN_MESSAGES_FOR_ANALYSIS = 4;

function normalizeTitle(s: string): string {
  return s.toLowerCase().trim();
}

function titleSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(" "));
  const setB = new Set(b.split(" "));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Współdzielona logika przeliczenia wzorców dla użytkownika - używana zarówno
 * przez ręczny przycisk "Przeanalizuj ponownie" (app/api/patterns/route.ts),
 * jak i automatycznie w tle co kilka wiadomości (app/api/messages/route.ts).
 * Cicho pomija (zwraca null), jeśli materiału jest za mało - w trybie
 * automatycznym to normalne i nie powinno przerywać rozmowy.
 */
export async function recomputePatternsForUser(userId: string): Promise<{ created: number; updated: number } | null> {
  const [memories, messageCount] = await Promise.all([
    prisma.memory.findMany({
      where: { userId, archived: false, category: { in: ["FACT", "INTERPRETATION", "PATTERN"] } },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    prisma.message.count({ where: { conversation: { userId }, role: "user" } }),
  ]);

  if (messageCount < MIN_MESSAGES_FOR_ANALYSIS || memories.length === 0) return null;

  const contextText = memories.map((m) => `- [${m.subject}/${m.category}] ${m.content}`).join("\n");
  const candidates = await analyzePatterns(contextText);
  if (candidates.length === 0) return { created: 0, updated: 0 };

  const existing = await prisma.pattern.findMany({ where: { userId } });
  let created = 0;
  let updated = 0;

  for (const candidate of candidates) {
    const match = existing.find((p) => titleSimilarity(normalizeTitle(p.title), normalizeTitle(candidate.title)) > 0.5);
    if (match) {
      await prisma.pattern.update({
        where: { id: match.id },
        data: {
          occurrences: { increment: 1 },
          lastSeenAt: new Date(),
          description: candidate.description,
          cycleSteps: candidate.cycleSteps.length > 0 ? candidate.cycleSteps : (match.cycleSteps as any),
        },
      });
      updated++;
    } else {
      await prisma.pattern.create({
        data: {
          userId,
          title: candidate.title,
          description: candidate.description,
          category: candidate.category,
          cycleSteps: candidate.cycleSteps,
        },
      });
      created++;
    }
  }

  return { created, updated };
}
