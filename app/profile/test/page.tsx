"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AttachmentTest } from "@/components/onboarding/AttachmentTest";
import type { AttachmentAnswer } from "@/lib/attachmentQuestions";

export default function RetakeTestPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete(answers: AttachmentAnswer[]) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error("Nie udało się zapisać wyniku.");
      router.push("/profile");
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? "Coś poszło nie tak.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-canvas px-6 py-12">
      <h1 className="mb-2 font-display text-2xl text-navy-900">Test stylu przywiązania</h1>
      <p className="mb-6 text-sm text-navy-400">
        Nowy wynik dołączy do historii Twoich testów — poprzednie wyniki nie znikają.
      </p>
      {error && <p role="alert" className="mb-4 rounded-lg bg-anxious/10 px-3 py-2 text-sm text-anxious">{error}</p>}
      <AttachmentTest onComplete={handleComplete} submitting={submitting} />
    </main>
  );
}
