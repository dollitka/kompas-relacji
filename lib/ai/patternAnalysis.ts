import { getStructuredJSON } from "@/lib/ai/client";

// ---------------------------------------------------------------------------
// Analiza wzorców (sekcja 8 specyfikacji): na żądanie użytkownika ("Wzorce w
// naszej relacji" → "Przeanalizuj ponownie") prosimy AI o spojrzenie na
// zebrane fakty/interpretacje i historię rozmów, i wskazanie POWTARZAJĄCYCH
// SIĘ schematów — najlepiej z rozbiciem na kroki cyklu (np. pursue/withdraw).
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
