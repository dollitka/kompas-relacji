import { getStructuredJSON } from "@/lib/ai/client";

// ---------------------------------------------------------------------------
// Narzędzie do ręcznego "sprzątania" pamięci na żądanie użytkownika (przycisk
// w zakładce Pamięć). Uzupełnia zapobiegawczą deduplikację przy zapisie
// (patrz memoryExtraction.ts) - ta funkcja czyści już istniejące duplikaty,
// które i tak czasem powstaną, bo dopasowanie tekstowe i instrukcje w
// prompcie nie łapią 100% przypadków (różne sformułowania po polsku).
// ---------------------------------------------------------------------------

const CONSOLIDATION_SYSTEM_PROMPT = `Dostajesz listę zapisanych wpisów pamięci użytkownika (id, kategoria/subject,
treść). Twoje zadanie: znaleźć grupy wpisów, które mówią DOKŁADNIE TO SAMO innymi
słowami - prawdziwe powtórzenia tego samego faktu/obserwacji, nie tylko pokrewny
temat - i zaproponować dla każdej takiej grupy JEDNĄ, połączoną, najlepszą wersję.

NIE łącz wpisów, które są tylko tematycznie podobne, ale wnoszą różne, osobne
informacje. Łącz WYŁĄCZNIE prawdziwe duplikaty tego samego faktu.

Odpowiedz WYŁĄCZNIE poprawnym JSON-em, bez markdown:
{"merges": [{"ids": ["id1","id2"], "mergedContent": "połączona, najlepsza wersja zdania po polsku"}]}

Jeśli nie znajdziesz żadnych duplikatów, zwróć {"merges": []} - to częsty, dobry wynik.`;

export type MergeCandidate = { ids: string[]; mergedContent: string };

export async function findDuplicateMerges(
  items: { id: string; subject: string; content: string }[]
): Promise<MergeCandidate[]> {
  if (items.length < 2) return [];

  const listText = items.map((i) => `- id=${i.id} [${i.subject}] ${i.content}`).join("\n");

  const raw = await getStructuredJSON(CONSOLIDATION_SYSTEM_PROMPT, listText);
  try {
    const cleaned = raw.replace(/^```json\s*|```$/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed.merges)) return [];

    const validIds = new Set(items.map((i) => i.id));
    return parsed.merges
      .filter((m: any) => m && Array.isArray(m.ids) && typeof m.mergedContent === "string")
      .map((m: any) => ({
        ids: m.ids.filter((id: any) => typeof id === "string" && validIds.has(id)),
        mergedContent: String(m.mergedContent).slice(0, 500),
      }))
      .filter((m: MergeCandidate) => m.ids.length >= 2);
  } catch {
    return [];
  }
}
