"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CrisisBanner } from "@/components/chat/CrisisBanner";

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  flaggedCrisis?: boolean;
};

// Web Speech API nie jest ustandaryzowane we wszystkich przeglądarkach (np.
// desktopowy Firefox go nie ma) - stąd `any` i sprawdzanie dostępności w
// runtime zamiast polegania na typach TypeScript.
function getSpeechRecognitionCtor(): any {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function ChatWindow({
  conversationId,
  title,
  initialMessages,
}: {
  conversationId: string;
  title: string;
  initialMessages: ChatMsg[];
}) {
  const [messages, setMessages] = useState<ChatMsg[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crisisType, setCrisisType] = useState<"violence" | "self_harm" | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  useEffect(() => {
    setSpeechSupported(getSpeechRecognitionCtor() !== null);
    return () => {
      recognitionRef.current?.stop?.();
    };
  }, []);

  function toggleRecording() {
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "pl-PL";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      if (transcript) {
        setDraft((prev) => (prev.trim() ? `${prev.trim()} ${transcript}` : transcript));
      }
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setError(null);
    setCrisisType(null);
    setSending(true);
    setDraft("");

    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempId, role: "user", content: trimmed }]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, content: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Nie udało się wysłać wiadomości.");
        setSending(false);
        return;
      }

      setMessages((prev) => [...prev, { id: data.message.id, role: "assistant", content: data.message.content }]);
      if (data.crisis) setCrisisType(data.crisis);
    } catch {
      setError("Brak połączenia. Sprawdź internet i spróbuj ponownie.");
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(draft);
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/chat" className="text-sm text-navy-400 hover:text-navy-700">
          ← Wszystkie rozmowy
        </Link>
        <h1 className="hidden truncate font-display text-lg text-navy-900 sm:block">{title}</h1>
        <span />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className="card p-6 text-sm text-navy-400">
            Opisz sytuację, którą chcesz przeanalizować — im więcej konkretów, tym trafniejsza odpowiedź.
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "ml-auto bg-navy-700 text-white"
                  : "border border-navy-100 bg-white text-ink"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {crisisType && <CrisisBanner type={crisisType} />}
        {sending && (
          <div className="max-w-[85%] rounded-2xl border border-navy-100 bg-white px-4 py-3 text-sm text-navy-300">
            Analizuję…
          </div>
        )}
        {error && (
          <p role="alert" className="rounded-lg bg-anxious/10 px-3 py-2 text-sm text-anxious">
            {error}
          </p>
        )}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-2 border-t border-navy-100 pt-4">
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Opisz sytuację… (Enter = nowa linijka)"
            rows={2}
            className="input-field flex-1 resize-none"
            maxLength={6000}
          />
          {speechSupported && (
            <button
              type="button"
              onClick={toggleRecording}
              title={isRecording ? "Zatrzymaj nagrywanie" : "Nagraj wiadomość głosowo"}
              aria-label={isRecording ? "Zatrzymaj nagrywanie głosowe" : "Nagraj wiadomość głosowo"}
              className={`shrink-0 rounded-full border p-2.5 transition ${
                isRecording
                  ? "animate-pulse border-anxious bg-anxious/10 text-anxious"
                  : "border-navy-100 bg-white text-navy-500 hover:bg-navy-50"
              }`}
            >
              {/* Prosta ikona mikrofonu (SVG, bez zewnętrznej biblioteki) */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          )}
          <button type="submit" disabled={sending || !draft.trim()} className="btn-primary shrink-0">
            Wyślij
          </button>
        </div>
        {isRecording && <p className="mt-1.5 text-xs text-anxious">Nagrywam… mów teraz.</p>}
      </form>
    </div>
  );
}
