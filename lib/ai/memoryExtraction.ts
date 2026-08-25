import { getStructuredJSON } from "@/lib/ai/client";
import { prisma } from "@/lib/db";
import { getActivePartnerId } from "@/lib/partnerLink";

// ---------------------------------------------------------------------------
// Po każdej turze rozmowy (wiadomość użytkownika + odpowiedź asystenta)
// wykonujemy drugie, "ciche" wywołanie AI, które prosi model o wskazanie
// KANDYDATÓW na trwałą pamięć. Nie zapisujemy każdej wypowiedzi — tylko
// informacje, które mają realną szansę być przydatne w przyszłych rozmowach
// (fakty, powtarzające się reakcje, ważne wydarzenia, otwarte problemy).
//
// WAŻNE: model dostaje do wglądu to, co już zostało zapisane wcześniej (patrz
// buildExistingMemorySummary), żeby nie proponował w kółko tego samego faktu
// innymi słowami ("Daniel ma ADHD i jest unikający" / "Daniel przejawia cechy
// unikające i ma ADHD" / ...). To główna linia obrony przed duplikatami -
// prosta deduplikacja tekstowa niżej jest tylko dodatkową siatką bezpieczeństwa,
// bo różne odmiany słów po polsku łatwo "oszukują" porównywanie tekstu.
//
// Próg: zapisujemy tylko kandydatów z importance >= MIN_IMPORTANCE, żeby
// pamięć nie zapychała się drobiazgami z jednej wiadomości.
// ---------------------------------------------------------------------------

const MIN_IMPORTANCE_TO_SAVE = 55;
const MAX_CANDIDATES_PER_TURN = 5;
const MAX_EXISTING_MEMORY_IN_PROMPT = 40;
const DUPLICATE_SIMILARITY_THRESHOLD = 0.55;

const EXTRACTION_SYSTEM_PROMPT = `Analizujesz fragment rozmowy między użytkownikiem a AI Relationship Analyst.
Twoje jedyne zadanie: wskazać, jakie informacje z tej wymiany WARTO zapisać jako
długoterminową pamięć o użytkowniku, jego partnerze/partnerce lub relacji — czyli
takie, które mogłyby być przydatne w PRZYSZŁYCH, innych rozmowach.

Dostajesz też listę "Co już wiadomo" - to, co zostało zapisane w poprzednich
rozmowach. To NAJWAŻNIEJSZA zasada: jeśli coś z bieżącej wymiany powtarza fakt już
obecny na tej liście - NAWET INNYMI SŁOWAMI, NAWET Z INNYM NIUANSEM - NIE
proponuj tego ponownie. Przykład: jeśli na liście jest już "Daniel ma ADHD i
przejawia cechy unikającego stylu przywiązania", NIE proponuj potem "Daniel
prezentuje unikający styl przywiązania" ani "Partner ma ADHD i unika rozmów" -
to ten sam fakt przeformułowany. Zgłoś nowy wpis tylko, gdy pojawia się coś
ISTOTNIE nowego (nowy konkretny przykład zachowania, zmiana, coś, czego wcześniej
nie było na liście) - a nie samo powtórzenie z inną stylistyką.

NIE zapisuj: chwilowych emocji bez kontekstu, rzeczy oczywistych, powtórzeń tego, co
już wiadomo (patrz wyżej), drobnych szczegółów bez znaczenia na przyszłość.

ZAPISUJ: konkretne NOWE fakty o zachowaniach, powtarzające się reakcje, ważne
wydarzenia, nierozwiązane problemy, granice, potrzeby, cechy sugerujące styl
przywiązania - czego jeszcze nie ma na liście "Co już wiadomo".

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

Jeśli nic nowego nie warto zapisać, zwróć {"candidates": []} - to częsty i dobry
wynik, nie staraj się wymyślić czegoś na siłę. Maksymalnie 5 kandydatów.
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
  crisisFlagged: boolean;
}): Promise<void> {
  // Sprawdź, czy użytkownik w ogóle zezwala na zapisywanie nowej pamięci.
  const settings = await prisma.settings.findUnique({ where: { userId: params.userId } });
  if (settings && settings.memoryEnabled === false) return;

  // Pobierz istniejącą pamięć NAJPIERW - potrzebna zarówno do promptu (żeby AI
  // nie powtarzało tego, co już wie), jak i do końcowej deduplikacji tekstowej.
  const existing = await prisma.memory.findMany({
    where: { userId: params.userId, archived: false },
    select: { content: true, subject: true, category: true, importance: true },
    orderBy: { importance: "desc" },
    take: 200,
  });

  const existingForPrompt = existing.slice(0, MAX_EXISTING_MEMORY_IN_PROMPT);
  const existingSummary =
    existingForPrompt.length === 0
      ? "(jeszcze nic nie zapisano)"
      : existingForPrompt.map((m) => `- [${m.subject}/${m.category}] ${m.content}`).join("\n");

  const userContent = `## Co już wiadomo (już zapisane w pamięci)\n${existingSummary}\n\n## Bieżąca wymiana do przeanalizowania\n\nWiadomość użytkownika:\n"""${params.userMessage}"""\n\nOdpowiedź AI:\n"""${params.assistantMessage}"""`;

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

  // Dodatkowa siatka bezpieczeństwa: prosta deduplikacja tekstowa, porównywana
  // tylko w obrębie tego samego "subject" (USER/PARTNER/RELATIONSHIP), żeby nie
  // dawać fałszywych trafień między niepowiązanymi tematami.
  const toCreate = candidates.filter((c) => {
    const sameSubject = existing.filter((e) => e.subject === c.subject);
    return !sameSubject.some((e) => similarity(normalize(e.content), normalize(c.content)) > DUPLICATE_SIMILARITY_THRESHOLD);
  });

  if (toCreate.length === 0) return;

  // --- Kwalifikacja do "wspólnej puli" z partnerem (opcjonalna funkcja) ---
  // TWARDA ZASADA BEZPIECZEŃSTWA: jeśli w TEJ rozmowie kiedykolwiek padł sygnał
  // kryzysowy (przemoc, groźby, myśli samobójcze - patrz crisisDetection.ts),
  // NIC z tej rozmowy nigdy nie trafia do kolejki "do udostępnienia partnerowi",
  // niezależnie od tego, czy bieżąca wiadomość też go wywołała. Brak wyjątków.
  const conversationHadCrisis =
    params.crisisFlagged ||
    (await prisma.message.count({ where: { conversationId: params.conversationId, flaggedCrisis: true } })) > 0;

  const partnerId = conversationHadCrisis ? null : await getActivePartnerId(params.userId);
  const isEligibleForSharePrompt = (c: Candidate) =>
    !conversationHadCrisis && partnerId !== null && c.subject === "RELATIONSHIP" && (c.category === "FACT" || c.category === "INTERPRETATION");

  await prisma.memory.createMany({
    data: toCreate.map((c) => ({
      userId: params.userId,
      category: c.category,
      subject: c.subject,
      content: c.content,
      confidence: c.confidence,
      importance: c.importance,
      sourceConversationId: params.conversationId,
      shareStatus: isEligibleForSharePrompt(c) ? "PENDING" : "NONE",
    })),
  });
}

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/[.,!?;:"']/g, "").replace(/\s+/g, " ");
}

// Prosta miara podobieństwa (Jaccard na słowach) — dodatkowa siatka
// bezpieczeństwa poza kontekstem podawanym modelowi w prompcie.
function similarity(a: string, b: string): number {
  const setA = new Set(a.split(" "));
  const setB = new Set(b.split(" "));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}
