"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

export function SettingsPanel({
  initialSettings,
}: {
  initialSettings: { memoryEnabled: boolean; aiAnalysisConsent: boolean };
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function updateSetting(key: keyof typeof settings, value: boolean) {
    setSaving(true);
    setMessage(null);
    const next = { ...settings, [key]: value };
    setSettings(next);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    setSaving(false);
    if (!res.ok) {
      setSettings(settings); // rollback
      setMessage("Nie udało się zapisać zmiany.");
    }
  }

  async function handleClearMemory() {
    if (!confirm("Na pewno chcesz usunąć całą zapisaną pamięć (fakty, interpretacje, wzorce, wydarzenia)? Tej operacji nie można cofnąć.")) return;
    const res = await fetch("/api/memory", { method: "DELETE" });
    setMessage(res.ok ? "Pamięć została wyczyszczona." : "Nie udało się wyczyścić pamięci.");
  }

  async function handleDeleteAccount() {
    const confirmed = confirm(
      "Na pewno chcesz USUNĄĆ KONTO? Usunięte zostaną wszystkie rozmowy, pamięć, wzorce i wyniki testów. Tej operacji nie można cofnąć."
    );
    if (!confirmed) return;
    const doubleCheck = confirm("To ostatnie potwierdzenie — konto i wszystkie dane zostaną trwale usunięte. Kontynuować?");
    if (!doubleCheck) return;

    const res = await fetch("/api/account", { method: "DELETE" });
    if (res.ok) {
      await signOut({ callbackUrl: "/" });
    } else {
      setMessage("Nie udało się usunąć konta. Spróbuj ponownie.");
    }
  }

  return (
    <div className="mt-6 max-w-2xl space-y-6">
      {message && <p className="rounded-lg bg-navy-50 px-3 py-2 text-sm text-navy-600">{message}</p>}

      <section className="card p-6">
        <h2 className="mb-4 text-sm font-semibold text-navy-700">Prywatność i pamięć</h2>

        <Toggle
          label="Pozwól aplikacji zapisywać nową pamięć długoterminową"
          description="Gdy wyłączone, AI przestanie zapisywać nowe fakty/interpretacje/wzorce z rozmów. Istniejąca pamięć zostaje, dopóki jej nie usuniesz."
          checked={settings.memoryEnabled}
          onChange={(v) => updateSetting("memoryEnabled", v)}
          disabled={saving}
        />

        <div className="mt-4 border-t border-navy-100 pt-4">
          <Toggle
            label="Potwierdzam, że rozumiem, że moje rozmowy są analizowane przez AI"
            description="Wiadomości wysyłane w chacie są przetwarzane przez model AI (Anthropic Claude), aby wygenerować odpowiedź i zaproponować pamięć do zapisania."
            checked={settings.aiAnalysisConsent}
            onChange={(v) => updateSetting("aiAnalysisConsent", v)}
            disabled={saving}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3 border-t border-navy-100 pt-4">
          <Link href="/memory" className="btn-secondary">Zarządzaj pamięcią</Link>
          <button onClick={handleClearMemory} className="btn-secondary border-anxious/30 text-anxious hover:bg-anxious/5">
            Wyczyść całą pamięć
          </button>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="mb-2 text-sm font-semibold text-navy-700">Kontakt</h2>
        <p className="mb-3 text-sm text-navy-500">
          Masz uwagi, znalazłeś/aś błąd albo chcesz coś zaproponować? Napisz do nas.
        </p>
        <a href="mailto:krelacji@gmail.com" className="text-sm font-medium text-navy-700 underline underline-offset-2 hover:text-navy-900">
          krelacji@gmail.com
        </a>
      </section>

      <section className="card p-6">
        <h2 className="mb-2 text-sm font-semibold text-navy-700">Dokumenty</h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/privacy" className="text-navy-500 underline underline-offset-2 hover:text-navy-900">Polityka prywatności</Link>
          <Link href="/terms" className="text-navy-500 underline underline-offset-2 hover:text-navy-900">Regulamin (ToS)</Link>
        </div>
      </section>

      <section className="card border-anxious/20 p-6">
        <h2 className="mb-2 text-sm font-semibold text-anxious">Strefa zagrożenia</h2>
        <p className="mb-4 text-sm text-navy-500">
          Usunięcie konta jest nieodwracalne. Wszystkie rozmowy, pamięć, wzorce i wyniki
          testów zostaną trwale skasowane.
        </p>
        <button onClick={handleDeleteAccount} className="btn-primary bg-anxious hover:bg-anxious/90">
          Usuń konto i wszystkie dane
        </button>
      </section>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-medium text-navy-800">{label}</span>
        <span className="mt-0.5 block text-xs text-navy-400">{description}</span>
      </span>
      <input
        type="checkbox"
        className="mt-1 h-5 w-5 shrink-0 accent-navy-700"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
