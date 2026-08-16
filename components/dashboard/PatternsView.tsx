"use client";

import { useState } from "react";

type PatternItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  cycleSteps: string[] | null;
  occurrences: number;
  lastSeenAt: string;
};

export function PatternsView({ initialPatterns }: { initialPatterns: PatternItem[] }) {
  const [patterns, setPatterns] = useState(initialPatterns);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/patterns", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Nie udało się przeanalizować wzorców.");
        return;
      }
      if (data.patterns) setPatterns(data.patterns);
      if (data.message) setInfo(data.message);
    } catch {
      setError("Brak połączenia. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <button onClick={handleAnalyze} disabled={loading} className="btn-primary mb-6">
        {loading ? "Analizuję…" : "Przeanalizuj ponownie"}
      </button>

      {error && <p role="alert" className="mb-4 rounded-lg bg-anxious/10 px-3 py-2 text-sm text-anxious">{error}</p>}
      {info && <p className="mb-4 rounded-lg bg-navy-50 px-3 py-2 text-sm text-navy-500">{info}</p>}

      {patterns.length === 0 ? (
        <p className="card p-6 text-sm text-navy-400">
          Brak zidentyfikowanych wzorców. Opisz kilka sytuacji w chacie, a potem kliknij „Przeanalizuj ponownie”.
        </p>
      ) : (
        <div className="space-y-4">
          {patterns.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-base text-navy-900">{p.title}</h3>
                <span className="pill bg-navy-50 text-navy-500">zaobserwowano {p.occurrences}×</span>
              </div>
              <p className="text-sm leading-relaxed text-navy-600">{p.description}</p>

              {p.cycleSteps && p.cycleSteps.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {p.cycleSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="rounded-full bg-lilac-50 px-3 py-1.5 text-xs text-navy-700">{step}</span>
                      {i < p.cycleSteps!.length - 1 && <span className="text-navy-300">→</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
