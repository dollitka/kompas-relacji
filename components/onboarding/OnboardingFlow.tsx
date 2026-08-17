"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AttachmentTest } from "@/components/onboarding/AttachmentTest";
import { AttachmentScoreBars } from "@/components/dashboard/AttachmentScoreBars";
import type { AttachmentAnswer, AttachmentScores } from "@/lib/attachmentQuestions";

type StepData = {
  displayName: string;
  userGender: string;
  partnerGender: string;
  relationshipType: string;
  partnerName: string;
  relationshipStart: string;
  livingTogether: "" | "yes" | "no";
  relationshipRating: number;
  topProblems: string;
  improvementGoals: string;
};

const RELATIONSHIP_TYPES = [
  "Związek heteroseksualny",
  "Związek jednopłciowy",
  "Związek niebinarny / inny",
  "Wolę nie określać",
];

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [scores, setScores] = useState<AttachmentScores | null>(null);

  const [data, setData] = useState<StepData>({
    displayName: "",
    userGender: "",
    partnerGender: "",
    relationshipType: "",
    partnerName: "",
    relationshipStart: "",
    livingTogether: "",
    relationshipRating: 6,
    topProblems: "",
    improvementGoals: "",
  });

  function update<K extends keyof StepData>(key: K, value: StepData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  async function saveProfileAndContinue() {
    setError(null);
    if (!data.displayName.trim()) {
      setError("Podaj pseudonim, po którym będziemy się do Ciebie zwracać.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: data.displayName,
          userGender: data.userGender || null,
          partnerGender: data.partnerGender || null,
          relationshipType: data.relationshipType || "Wolę nie określać",
          partnerName: data.partnerName || null,
          relationshipStart: data.relationshipStart || null,
          livingTogether: data.livingTogether === "" ? null : data.livingTogether === "yes",
          relationshipRating: data.relationshipRating,
          topProblems: data.topProblems || null,
          improvementGoals: data.improvementGoals || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Nie udało się zapisać danych.");
      }
      setStep(3);
    } catch (e: any) {
      setError(e.message ?? "Coś poszło nie tak.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestComplete(answers: AttachmentAnswer[]) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error("Nie udało się zapisać wyniku testu.");
      const body = await res.json();
      setScores({
        anxiousScore: body.assessment.anxiousScore,
        avoidantScore: body.assessment.avoidantScore,
        secureScore: body.assessment.secureScore,
      });
      setStep(4);
    } catch (e: any) {
      setError(e.message ?? "Coś poszło nie tak.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <StepIndicator step={step} />

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-anxious/10 px-3 py-2 text-sm text-anxious">
          {error}
        </p>
      )}

      {step === 0 && (
        <div className="card p-8 text-center">
          <h1 className="font-display text-2xl text-navy-900">Witaj w Kompasie Relacji</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-navy-500">
            To prywatna przestrzeń, w której możesz opisywać sytuacje ze swojego związku i
            otrzymywać spojrzenie oparte na psychologii relacji i teorii przywiązania.
            Aplikacja zapamiętuje istotne rzeczy między rozmowami, żebyś nie musiał/a
            tłumaczyć wszystkiego od nowa — a Ty zawsze możesz zobaczyć i skasować to, co
            zapamiętała.
          </p>
          <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-navy-300">
            To narzędzie nie diagnozuje i nie zastępuje terapeuty. W sytuacjach zagrożenia
            zawsze pierwszeństwo ma Twoje bezpieczeństwo.
          </p>
          <button className="btn-primary mt-6" onClick={() => setStep(1)}>
            Zaczynajmy
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="card space-y-5 p-8">
          <h2 className="font-display text-xl text-navy-900">Kilka słów o Tobie</h2>
          <Field label="Jak mamy się do Ciebie zwracać? (nick, nie musi być prawdziwe imię)">
            <input className="input-field" value={data.displayName} onChange={(e) => update("displayName", e.target.value)} maxLength={40} />
          </Field>
          <Field label="Twoja płeć (opcjonalnie)">
            <input className="input-field" value={data.userGender} onChange={(e) => update("userGender", e.target.value)} placeholder="np. kobieta, mężczyzna, niebinarna/y…" />
          </Field>
          <Field label="Płeć partnera/partnerki (opcjonalnie)">
            <input className="input-field" value={data.partnerGender} onChange={(e) => update("partnerGender", e.target.value)} />
          </Field>
          <Field label="Jak nazywać Twojego partnera/partnerkę w rozmowach? (opcjonalnie)">
            <input className="input-field" value={data.partnerName} onChange={(e) => update("partnerName", e.target.value)} placeholder="np. imię, inicjał, «mój partner»" />
          </Field>
          <Field label="Rodzaj relacji">
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIP_TYPES.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => update("relationshipType", t)}
                  className={`pill border ${data.relationshipType === t ? "border-navy-700 bg-navy-700 text-white" : "border-navy-100 bg-white text-navy-500"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>
          <div className="flex justify-between pt-2">
            <button className="btn-secondary" onClick={() => setStep(0)}>Wstecz</button>
            <button className="btn-primary" onClick={() => setStep(2)} disabled={!data.displayName.trim()}>Dalej</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card space-y-5 p-8">
          <h2 className="font-display text-xl text-navy-900">Wasz związek</h2>
          <Field label="Od kiedy jesteście razem? (opcjonalnie)">
            <div className="flex items-center gap-2">
              <input type="date" className="input-field" value={data.relationshipStart} onChange={(e) => update("relationshipStart", e.target.value)} />
              {data.relationshipStart && (
                <button
                  type="button"
                  onClick={() => update("relationshipStart", "")}
                  className="shrink-0 whitespace-nowrap text-xs text-navy-400 underline underline-offset-2 hover:text-navy-700"
                >
                  Wyczyść datę
                </button>
              )}
            </div>
          </Field>
          <Field label="Czy mieszkacie razem?">
            <div className="flex gap-2">
              {[["yes", "Tak"], ["no", "Nie"]].map(([val, label]) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => update("livingTogether", val as "yes" | "no")}
                  className={`pill border ${data.livingTogether === val ? "border-navy-700 bg-navy-700 text-white" : "border-navy-100 bg-white text-navy-500"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>
          <Field label={`Jak oceniasz swoją relację w skali 1-10? (${data.relationshipRating})`}>
            <input
              type="range"
              min={1}
              max={10}
              value={data.relationshipRating}
              onChange={(e) => update("relationshipRating", Number(e.target.value))}
              className="w-full accent-navy-700"
            />
          </Field>
          <Field label="Jakie są Wasze największe obecne problemy?">
            <textarea className="input-field min-h-24" value={data.topProblems} onChange={(e) => update("topProblems", e.target.value)} maxLength={1000} />
          </Field>
          <Field label="Co chciał(a)byś poprawić w tej relacji?">
            <textarea className="input-field min-h-24" value={data.improvementGoals} onChange={(e) => update("improvementGoals", e.target.value)} maxLength={1000} />
          </Field>
          <div className="flex justify-between pt-2">
            <button className="btn-secondary" onClick={() => setStep(1)}>Wstecz</button>
            <button className="btn-primary" onClick={saveProfileAndContinue} disabled={saving}>
              {saving ? "Zapisywanie…" : "Dalej: test przywiązania"}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="card mb-6 p-6">
            <h2 className="font-display text-xl text-navy-900">Test stylu przywiązania</h2>
            <p className="mt-2 text-sm leading-relaxed text-navy-500">
              To orientacyjny kwestionariusz, nie diagnoza. Odpowiadaj tak, jak zwykle
              zachowujesz się w bliskich związkach. Możesz pominąć dowolne pytanie.
            </p>
          </div>
          <AttachmentTest onComplete={handleTestComplete} submitting={saving} />
        </div>
      )}

      {step === 4 && scores && (
        <div className="card p-8 text-center">
          <h2 className="font-display text-xl text-navy-900">Twój profil przywiązania</h2>
          <p className="mt-1 text-sm text-navy-400">Zawsze będziesz mieć do niego dostęp w zakładce Profil.</p>
          <div className="mt-6 text-left">
            <AttachmentScoreBars scores={scores} />
          </div>
          <button
            className="btn-primary mt-8"
            onClick={() => {
              router.push("/dashboard");
              router.refresh();
            }}
          >
            Przejdź do panelu
          </button>
        </div>
      )}
    </div>
  );
}

function StepIndicator({ step }: { step: number }) {
  const labels = ["Powitanie", "O Tobie", "Związek", "Test", "Wynik"];
  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      {labels.map((l, i) => (
        <div key={l} className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${i <= step ? "bg-navy-700" : "bg-navy-100"}`} />
          {i < labels.length - 1 && <div className={`h-px w-6 ${i < step ? "bg-navy-700" : "bg-navy-100"}`} />}
        </div>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-navy-700">{label}</label>
      {children}
    </div>
  );
}
