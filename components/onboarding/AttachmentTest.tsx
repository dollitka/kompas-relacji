"use client";

import { useMemo, useState } from "react";
import { ATTACHMENT_QUESTIONS, LIKERT_LABELS, type AttachmentAnswer } from "@/lib/attachmentQuestions";

const QUESTIONS_PER_PAGE = 5;

export function AttachmentTest({
  onComplete,
  submitting,
}: {
  onComplete: (answers: AttachmentAnswer[]) => void;
  submitting?: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [page, setPage] = useState(0);

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
            <div className="flex flex-wrap items-center gap-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <label
                  key={val}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs transition ${
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
              <button
                type="button"
                onClick={() => setAnswer(q.id, null)}
                className={`ml-1 rounded-full px-3 py-1.5 text-xs underline-offset-2 ${
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
