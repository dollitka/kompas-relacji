// ---------------------------------------------------------------------------
// Cienki wrapper na Anthropic Messages API. Używany WYŁĄCZNIE po stronie
// serwera (API routes / server actions) — klucz API nigdy nie trafia do
// przeglądarki.
// ---------------------------------------------------------------------------

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export class AnthropicConfigError extends Error {}
export class AnthropicRateLimitError extends Error {}
export class AnthropicAPIError extends Error {}

function getModel(): string {
  return process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";
}

async function callAnthropic(params: {
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AnthropicConfigError(
      "Brak ANTHROPIC_API_KEY w zmiennych środowiskowych. Ustaw ją w .env (patrz .env.example)."
    );
  }

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: getModel(),
        max_tokens: params.maxTokens ?? 1500,
        temperature: params.temperature ?? 1,
        system: params.system,
        messages: params.messages,
      }),
    });
  } catch (networkErr) {
    throw new AnthropicAPIError("Brak połączenia z API modelu AI. Sprawdź internet i spróbuj ponownie.");
  }

  if (response.status === 429) {
    throw new AnthropicRateLimitError("Zbyt wiele zapytań do AI w krótkim czasie. Spróbuj za chwilę.");
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new AnthropicAPIError(`Błąd API modelu AI (status ${response.status}): ${body.slice(0, 300)}`);
  }

  const data = await response.json();

  const text = (data.content ?? [])
    .filter((block: any) => block.type === "text")
    .map((block: any) => block.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new AnthropicAPIError("Model AI zwrócił pustą odpowiedź.");
  }

  return text;
}

/** Główna rozmowa użytkownika z asystentem relacji. */
export async function getAssistantReply(system: string, messages: ChatMessage[]): Promise<string> {
  return callAnthropic({ system, messages, maxTokens: 1800, temperature: 1 });
}

/**
 * Drugie, "ciche" wywołanie AI po turze rozmowy — prosi model o wyodrębnienie
 * kandydatów na trwałą pamięć w formacie JSON. Niższa temperatura dla
 * stabilniejszej, bardziej przewidywalnej strukturyzacji danych.
 */
export async function getStructuredJSON(system: string, userContent: string): Promise<string> {
  return callAnthropic({
    system,
    messages: [{ role: "user", content: userContent }],
    maxTokens: 1200,
    temperature: 0.2,
  });
}
