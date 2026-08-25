"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";

type MemoryItem = {
  id: string;
  category: string;
  subject: string;
  content: string;
  confidence: number;
  importance: number;
  userConfirmed: boolean;
  createdAt: string;
  shareStatus?: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  FACT: "Fakt",
  INTERPRETATION: "Interpretacja AI",
  PATTERN: "Wzorzec",
  IMPORTANT_EVENT: "Ważne wydarzenie",
  OPEN_ISSUE: "Otwarty problem",
};

const SUBJECT_LABELS: Record<string, string> = {
  USER: "O Tobie",
  PARTNER: "O partnerze/partnerce",
  RELATIONSHIP: "O relacji",
};

const CATEGORY_COLORS: Record<string, string> = {
  FACT: "bg-navy-50 text-navy-700",
  INTERPRETATION: "bg-lilac-100 text-navy-700",
  PATTERN: "bg-avoidant/10 text-avoidant",
  IMPORTANT_EVENT: "bg-secure/10 text-secure",
  OPEN_ISSUE: "bg-anxious/10 text-anxious",
};

const SHARE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Do zatwierdzenia (zakładka Partner)",
  APPROVED: "Udostępnione partnerowi/ce",
};

export function MemoryManager({ initialMemories }: { initialMemories: MemoryItem[] }) {
  const [memories, setMemories] = useState(initialMemories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [consolidateMessage, setConsolidateMessage] = useState<string | null>(null);

  const grouped: Record<string, MemoryItem[]> = { USER: [], PARTNER: [], RELATIONSHIP: [] };
  for (const m of memories) grouped[m.subject]?.push(m);

  async function handleDelete(id: string) {
    setBusy(true);
    const res = await fetch(`/api/memory/${id}`, { method: "DELETE" });
    if (res.ok) setMemories((prev) => prev.filter((m) => m.id !== id));
    setBusy(false);
  }

  async function handleSaveEdit(id: string) {
    if (!draft.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/memory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      setMemories((prev) => prev.map((m) => (m.id === id ? { ...m, content: data.memory.content, userConfirmed: true } : m)));
      setEditingId(null);
    }
    setBusy(false);
  }

  async function handleClearAll() {
    if (!confirm("Na pewno chcesz usunąć całą zapisaną pamięć? Tej operacji nie można cofnąć.")) return;
    setBusy(true);
    const res = await fetch("/api/memory", { method: "DELETE" });
    if (res.ok) setMemories([]);
    setBusy(false);
  }

  async function handleConsolidate() {
    setBusy(true);
    setConsolidateMessage(null);
    try {
      const res = await fetch("/api/memory/consolidate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setConsolidateMessage(data.error ?? "Nie udało się przeanalizować pamięci.");
        return;
      }
      if (data.merged > 0) {
        setConsolidateMessage(`Połączono ${data.merged} ${data.merged === 1 ? "duplikat" : "duplikaty/duplikatów"}.`);
        const refreshed = await fetch("/api/memory");
        if (refreshed.ok) {
          const refreshedData = await refreshed.json();
          setMemories(refreshedData.memories ?? []);
        }
      } else {
        setConsolidateMessage(data.message ?? "Nie znaleziono duplikatów.");
      }
    } catch {
      setConsolidateMessage("Brak połączenia. Spróbuj ponownie.");
    } finally {
      setBusy(false);
    }
  }

  if (memories.length === 0) {
    return <p className="card p-6 text-sm text-navy-400">Pamięć jest pusta — pojawi się tu w miarę rozmów.</p>;
  }

  return (
    <div className="space-y-8">
      {(["USER", "PARTNER", "RELATIONSHIP"] as const).map((subject) =>
        grouped[subject].length > 0 ? (
          <section key={subject}>
            <h2 className="mb-3 text-sm font-semibold text-navy-700">{SUBJECT_LABELS[subject]}</h2>
            <div className="space-y-2">
              {grouped[subject].map((m) => (
                <div key={m.id} className="card p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`pill ${CATEGORY_COLORS[m.category] ?? "bg-navy-50 text-navy-700"}`}>
                      {CATEGORY_LABELS[m.category] ?? m.category}
                    </span>
                    <span className="text-xs text-navy-300">pewność {m.confidence}%</span>
                    <span className="text-xs text-navy-300">· {formatDate(m.createdAt)}</span>
                    {m.shareStatus && SHARE_STATUS_LABELS[m.shareStatus] && (
                      <span className="pill bg-lilac-50 text-navy-500">{SHARE_STATUS_LABELS[m.shareStatus]}</span>
                    )}
                  </div>

                  {editingId === m.id ? (
                    <div className="space-y-2">
                      <textarea
                        className="input-field min-h-20"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        maxLength={500}
                      />
                      <div className="flex gap-2">
                        <button className="btn-primary" disabled={busy} onClick={() => handleSaveEdit(m.id)}>
                          Zapisz
                        </button>
                        <button className="btn-secondary" onClick={() => setEditingId(null)}>
                          Anuluj
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm leading-relaxed text-navy-800">{m.content}</p>
                      <div className="flex shrink-0 gap-2">
                        <button
                          className="text-xs text-navy-400 hover:text-navy-700 hover:underline"
                          onClick={() => {
                            setEditingId(m.id);
                            setDraft(m.content);
                          }}
                        >
                          Edytuj
                        </button>
                        <button
                          className="text-xs text-anxious hover:underline"
                          disabled={busy}
                          onClick={() => handleDelete(m.id)}
                        >
                          Usuń
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null
      )}

      {consolidateMessage && <p className="rounded-lg bg-navy-50 px-3 py-2 text-sm text-navy-600">{consolidateMessage}</p>}

      <div className="flex flex-wrap gap-3">
        <button onClick={handleConsolidate} disabled={busy} className="btn-secondary">
          Wykryj i połącz duplikaty
        </button>
        <button onClick={handleClearAll} disabled={busy} className="btn-secondary border-anxious/30 text-anxious hover:bg-anxious/5">
          Wyczyść całą pamięć
        </button>
      </div>
    </div>
  );
}
