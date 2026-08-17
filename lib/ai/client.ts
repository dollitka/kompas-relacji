// ---------------------------------------------------------------------------
// Cienki wrapper na Google Gemini API (generativelanguage.googleapis.com).
// Używany WYŁĄCZNIE po stronie serwera (API routes) — klucz API nigdy nie
// trafia do przeglądarki.
//
// UWAGA (prywatność): w darmowym planie Gemini API Google może wykorzystywać
// treść zapytań do ulepszania swoich produktów. Jeśli to problem, przełącz
// się na płatne API (np. Anthropic Claude) i zaktualizuj ten plik zgodnie
// z dokumentacją odpowiedniego dostawcy.
// ---------------------------------------------------------------------------

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export class GeminiConfigError extends Error {}
export class GeminiRateLimitError extends Error {}
export class GeminiAPIError extends Error {}

function getModel(): string {
  return process.env.GEMINI_MODEL || "gemini-3-flash-preview";
}

function toGeminiRole(role: "user" | "assistant"): "user" | "model" {
  return role === "assistant" ? "model" : "user";
}

async function callGemini(params: {
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiConfigError(
      "Brak GEMINI_API_KEY w zmiennych środowiskowych. Ustaw ją w .env (patrz .env.example)."
    );
  }

  const url = `${GEMINI_API_BASE}/${getModel()}:generateContent?key=${apiKey}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: params.messages.map((m) => ({
          role: toGeminiRole(m.role),
          parts: [{ text: m.content }],
        })),
        systemInstruction: { parts: [{ text: params.system }] },
        generationConfig: {
          temperature: params.temperature ?? 1,
          maxOutputTokens: params.maxTokens ?? 1500,
        },
      }),
    });
  } catch {
    throw new GeminiAPIError("Brak połączenia z API modelu AI. Sprawdź internet i spróbuj ponownie.");
  }

  if (response.status === 429) {
    throw new GeminiRateLimitError(
      "Zbyt wiele zapytań do AI w krótkim czasie (darmowy limit Gemini). Spróbuj za chwilę."
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new GeminiAPIError(`Błąd API modelu AI (status ${response.status}): ${body.slice(0, 300)}`);
  }

  const data = await response.json();

  const candidate = data.candidates?.[0];
  const text = (candidate?.content?.parts ?? [])
    .map((p: any) => p.text || "")
    .join("\n")
    .trim();

  if (!text) {
    // Gemini czasem zwraca pustą odpowiedź z powodu filtrów bezpieczeństwa
    // (finishReason: "SAFETY" itp.) zamiast błędu HTTP.
    const reason = candidate?.finishReason ? ` (finishReason: ${candidate.finishReason})` : "";
    throw new GeminiAPIError(`Model AI zwrócił pustą odpowiedź${reason}.`);
  }

  return text;
}

/** Główna rozmowa użytkownika z asystentem relacji. */
export async function getAssistantReply(system: string, messages: ChatMessage[]): Promise<string> {
  const reply = await callGemini({ system, messages, maxTokens: 1800, temperature: 1 });
  return stripMarkdown(reply);
}

// Siatka bezpieczeństwa: interfejs czatu renderuje odpowiedzi jako zwykły tekst, więc
// nawet gdy model (mimo instrukcji w systemPromptcie) doda składnię Markdown, usuwamy
// najbardziej rażące symbole (# nagłówki, **pogrubienia**, *kursywy*), żeby użytkownik
// nie widział surowych znaków w czacie.
function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "") // nagłówki na początku linii
    .replace(/\*\*(.+?)\*\*/g, "$1") // **pogrubienie** (usuwane najpierw)
    .replace(/\*(.+?)\*/g, "$1"); // *kursywa* (bezpieczne dopiero po usunięciu **)
}

/**
 * Drugie, "ciche" wywołanie AI po turze rozmowy — prosi model o wyodrębnienie
 * kandydatów na trwałą pamięć / wzorce w formacie JSON. Niższa temperatura
 * dla stabilniejszej, bardziej przewidywalnej strukturyzacji danych.
 */
export async function getStructuredJSON(system: string, userContent: string): Promise<string> {
  return callGemini({
    system,
    messages: [{ role: "user", content: userContent }],
    maxTokens: 1200,
    temperature: 0.2,
  });
}
