import { getStructuredJSON } from "@/lib/ai/client";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// Po każdej turze rozmowy (wiadomość użytkownika + odpowiedź asystenta)
// wykonujemy drugie, "ciche" wywołanie AI, które prosi model o wskazanie
// KANDYDATÓW na trwałą pamięć. Nie zapisujemy każdej wypowiedzi — tylko
// informacje, które mają realną szansę być przydatne w przyszłych rozmowach
// (fakty, powtarzające się reakcje, ważne wydarzenia, otwarte problemy).
//
// Próg: zapisujemy tylko kandydatów z importance >= MIN_IMPORTANCE, żeby
// pamięć nie zapychała się drobiazgami z jednej wiadomości.
// ---------------------------------------------------------------------------

const MIN_IMPORTANCE_TO_SAVE = 55;
const MAX_CANDIDATES_PER_TURN = 5;

const EXTRACTION_SYSTEM_PROMPT = `Analizujesz fragment rozmowy między użytkownikiem a AI Relationship Analyst.
Twoje jedyne zadanie: wskazać, jakie informacje z tej wymiany WARTO zapisać jako
długoterminową pamięć o użytkowniku, jego partnerze/partnerce lub relacji — czyli
takie, które mogłyby być przydatne w PRZYSZŁYCH, innych rozmowach.

NIE zapisuj: chwilowych emocji bez kontekstu, rzeczy oczywistych, powtórzeń tego, co
już najpewniej wiadomo, drobnych szczegółów bez znaczenia na przyszłość.

ZAPISUJ: konkretne fakty o zachowaniach, powtarzające się reakcje, ważne wydarzenia,
nierozwiązane problemy, granice, potrzeby, cechy sugerujące styl przywiązania.

Odpowiedz WYŁĄCZNIE poprawnym JSON-em (bez markdown, bez komentarzy, bez preambuły),
w formacie:
{"candidates": [
  {
    "category": "FACT" | "INTERPRETATION" | "PATTERN" | "IMPORTANT_EVENT" | "OPEN_ISSUE",
    "subject": "USER" | "PARTNER" | "RELATIONSHIP",
    "content": "krótkie, konkretne zdanie po polsku",
    "confidence": 0-100,
    "importance": 0-100
  }
]}

Jeśli nic nie warto zapisać, zwróć {"candidates": []}. Maksymalnie 5 kandydatów.
"confidence" = jak bardzo to, co piszesz, wynika wprost z tekstu (FACT = zwykle wysoka,
INTERPRETATION = zwykle średnia). "importance" = jak przydatne może być to w przyszłości.`;

type Candidate = {
  category: "FACT" | "INTERPRETATION" | "PATTERN" | "IMPORTANT_EVENT" | "OPEN_ISSUE";
  subject: "USER" | "PARTNER" | "RELATIONSHIP";
  content: string;
  confidence: number;
  importance: number;
};

function safeParseCandidates(raw: string): Candidate[] {
  try {
    const cleaned = raw.replace(/^```json\s*|```$/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed.candidates)) return [];
    return parsed.candidates
      .filter(
        (c: any) =>
          c &&
          typeof c.content === "string" &&
          c.content.trim().length > 0 &&
          ["FACT", "INTERPRETATION", "PATTERN", "IMPORTANT_EVENT", "OPEN_ISSUE"].includes(c.category) &&
          ["USER", "PARTNER", "RELATIONSHIP"].includes(c.subject)
      )
      .slice(0, MAX_CANDIDATES_PER_TURN)
      .map((c: any) => ({
        category: c.category,
        subject: c.subject,
        content: String(c.content).slice(0, 500),
        confidence: clamp(Number(c.confidence) || 60),
        importance: clamp(Number(c.importance) || 50),
      }));
  } catch {
    return [];
  }
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function extractAndStoreMemories(params: {
  userId: string;
  conversationId: string;
  userMessage: string;
  assistantMessage: string;
}): Promise<void> {
  // Sprawdź, czy użytkownik w ogóle zezwala na zapisywanie nowej pamięci.
  const settings = await prisma.settings.findUnique({ where: { userId: params.userId } });
  if (settings && settings.memoryEnabled === false) return;

  const userContent = `Wiadomość użytkownika:\n"""${params.userMessage}"""\n\nOdpowiedź AI:\n"""${params.assistantMessage}"""`;

  let raw: string;
  try {
    raw = await getStructuredJSON(EXTRACTION_SYSTEM_PROMPT, userContent);
  } catch (err) {
    // Ekstrakcja pamięci jest funkcją pomocniczą — jej błąd nie może wywrócić
    // głównej rozmowy z użytkownikiem.
    console.error("Memory extraction failed:", err);
    return;
  }

  const candidates = safeParseCandidates(raw).filter((c) => c.importance >= MIN_IMPORTANCE_TO_SAVE);
  if (candidates.length === 0) return;

  // Prosta deduplikacja: pomiń kandydatów bardzo podobnych do istniejącej pamięci.
  const existing = await prisma.memory.findMany({
    where: { userId: params.userId, archived: false },
    select: { content: true },
    take: 200,
    orderBy: { createdAt: "desc" },
  });
  const existingNormalized = existing.map((m) => normalize(m.content));

  const toCreate = candidates.filter((c) => !existingNormalized.some((e) => similarity(e, normalize(c.content)) > 0.82));

  if (toCreate.length === 0) return;

  await prisma.memory.createMany({
    data: toCreate.map((c) => ({
      userId: params.userId,
      category: c.category,
      subject: c.subject,
      content: c.content,
      confidence: c.confidence,
      importance: c.importance,
      sourceConversationId: params.conversationId,
    })),
  });
}

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

// Bardzo prosta miara podobieństwa (Jaccard na słowach) — wystarczająca do
// odsiania niemal identycznych duplikatów bez dodatkowego wywołania AI.
function similarity(a: string, b: string): number {
  const setA = new Set(a.split(" "));
  const setB = new Set(b.split(" "));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}
