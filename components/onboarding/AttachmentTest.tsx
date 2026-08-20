"use client";

import { useEffect, useMemo, useState } from "react";
import { ATTACHMENT_QUESTIONS, LIKERT_LABELS, type AttachmentAnswer } from "@/lib/attachmentQuestions";

const QUESTIONS_PER_PAGE = 5;
// Zapisujemy postęp testu w przeglądarce, żeby przypadkowe wyjście z zakładki
// (albo odświeżenie strony) nie kasowało odpowiedzi użytkownika.
const DRAFT_STORAGE_KEY = "kompas-relacji:attachment-test-draft";

export function AttachmentTest({
  onComplete,
  submitting,
}: {
  onComplete: (answers: AttachmentAnswer[]) => void;
  submitting?: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [page, setPage] = useState(0);

  // Wczytaj zapisany wcześniej postęp (tylko w przeglądarce, po zamontowaniu -
  // dzięki temu nie ma niezgodności między renderem serwera a klienta).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          if (parsed.answers) setAnswers(parsed.answers);
          if (typeof parsed.page === "number") setPage(parsed.page);
        }
      }
    } catch {
      // Jeśli coś jest nie tak z zapisanymi danymi, po prostu zaczynamy od zera.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Zapisuj postęp przy każdej zmianie odpowiedzi lub strony.
  useEffect(() => {
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ answers, page }));
    } catch {
      // Brak dostępu do localStorage (np. tryb prywatny) - nie blokujemy testu.
    }
  }, [answers, page]);

  const pages = useMemo(() => {
    const chunks: (typeof ATTACHMENT_QUESTIONS)[] = [];
    for (let i = 0; i < ATTACHMENT_QUESTIONS.length; i += QUESTIONS_PER_PAGE) {
      chunks.push(ATTACHMENT_QUESTIONS.slice(i, i + QUESTIONS_PER_PAGE));
    }
    return chunks;
  }, []);

  const totalPages = pages.length;
  const currentQuestions = pages[page];
  const answeredCount = Object.keys(answers).length;
  const progressPct = Math.round((answeredCount / ATTACHMENT_QUESTIONS.length) * 100);

  function setAnswer(questionId: string, value: number | null) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleNext() {
    if (page < totalPages - 1) {
      setPage((p) => p + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const finalAnswers: AttachmentAnswer[] = ATTACHMENT_QUESTIONS.map((q) => ({
      questionId: q.id,
      value: answers[q.id] ?? null,
    }));
    try {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Nieistotne, jeśli się nie uda - i tak formularz jest już wysłany.
    }
    onComplete(finalAnswers);
  }

  function handleBack() {
    if (page > 0) {
      setPage((p) => p - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const currentPageAnswered = currentQuestions.every((q) => q.id in answers);

  return (
    <div>
      <div className="mb-6">
        <div className="mb-1 flex justify-between text-xs text-navy-400">
          <span>Pytanie {page * QUESTIONS_PER_PAGE + 1}–{Math.min((page + 1) * QUESTIONS_PER_PAGE, ATTACHMENT_QUESTIONS.length)} z {ATTACHMENT_QUESTIONS.length}</span>
          <span>{progressPct}% odpowiedzi</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-100">
          <div className="h-full rounded-full bg-lilac-400 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="space-y-6">
        {currentQuestions.map((q) => (
          <fieldset key={q.id} className="card p-5">
            <legend className="mb-3 text-sm font-medium text-navy-900">{q.text}</legend>
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <label
                  key={val}
                  className={`flex cursor-pointer items-center justify-center rounded-full border px-3 py-2 text-center text-xs transition ${
                    answers[q.id] === val
                      ? "border-navy-700 bg-navy-700 text-white"
                      : "border-navy-100 bg-white text-navy-500 hover:bg-navy-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={val}
                    className="sr-only"
                    checked={answers[q.id] === val}
                    onChange={() => setAnswer(q.id, val)}
                  />
                  {LIKERT_LABELS[val]}
                </label>
              ))}
            </div>
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={() => setAnswer(q.id, null)}
                className={`rounded-full px-3 py-1.5 text-xs underline-offset-2 ${
                  answers[q.id] === null && q.id in answers ? "text-navy-700 underline" : "text-navy-300 hover:underline"
                }`}
              >
                pomiń
              </button>
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button type="button" onClick={handleBack} disabled={page === 0} className="btn-secondary disabled:opacity-40">
          Wstecz
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!currentPageAnswered || submitting}
          className="btn-primary"
        >
          {page < totalPages - 1 ? "Dalej" : submitting ? "Liczenie wyniku…" : "Zakończ test"}
        </button>
      </div>
    </div>
  );
}
