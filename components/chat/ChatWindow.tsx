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

export function ChatWindow({
  conversationId,
  title,
  initialMessages,
  initialDraft,
}: {
  conversationId: string;
  title: string;
  initialMessages: ChatMsg[];
  initialDraft?: string;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>(initialMessages);
  const [draft, setDraft] = useState(initialDraft ?? "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crisisType, setCrisisType] = useState<"violence" | "self_harm" | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

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

      <form onSubmit={handleSubmit} className="mt-2 flex items-end gap-2 border-t border-navy-100 pt-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(draft);
            }
          }}
          placeholder="Opisz sytuację…"
          rows={2}
          className="input-field flex-1 resize-none"
          maxLength={6000}
        />
        <button type="submit" disabled={sending || !draft.trim()} className="btn-primary shrink-0">
          Wyślij
        </button>
      </form>
    </div>
  );
}
