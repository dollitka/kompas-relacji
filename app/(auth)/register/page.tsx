"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Hasła nie są identyczne.");
      return;
    }
    if (!consent) {
      setError("Musisz zaakceptować przetwarzanie danych, żeby założyć konto.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nick, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Nie udało się utworzyć konta.");
        setLoading(false);
        return;
      }

      const signInRes = await signIn("credentials", { nick, password, redirect: false });
      setLoading(false);
      if (signInRes?.error) {
        setError("Konto utworzone, ale logowanie się nie powiodło. Spróbuj się zalogować.");
        return;
      }
      router.push("/onboarding");
      router.refresh();
    } catch {
      setLoading(false);
      setError("Coś poszło nie tak. Spróbuj ponownie.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-aurora px-6 py-10">
      <div className="card w-full max-w-sm p-8">
        <h1 className="font-display text-2xl text-navy-900">Załóż konto</h1>
        <p className="mt-1 text-sm text-navy-400">
          Nie potrzebujemy Twojego prawdziwego imienia ani e-maila — wybierz dowolny nick.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="nick" className="mb-1 block text-sm font-medium text-navy-700">
              Nick
            </label>
            <input
              id="nick"
              className="input-field"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              minLength={3}
              maxLength={24}
              autoComplete="username"
              required
            />
            <p className="mt-1 text-xs text-navy-300">3-24 znaki: litery, cyfry, oraz "_", "-", "."</p>
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-navy-700">
              Hasło
            </label>
            <input
              id="password"
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
            <p className="mt-1 text-xs text-navy-300">Minimum 8 znaków.</p>
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-navy-700">
              Powtórz hasło
            </label>
            <input
              id="confirm"
              type="password"
              className="input-field"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-navy-50/50 p-3">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-navy-700"
              required
            />
            <span className="text-xs leading-relaxed text-navy-600">
              Zapoznałam/em się i akceptuję{" "}
              <Link href="/privacy" target="_blank" className="font-medium text-navy-700 underline underline-offset-2">
                Politykę prywatności
              </Link>{" "}
              oraz wyrażam zgodę na przetwarzanie moich danych, w tym analizę treści
              rozmów przez model AI, w celu działania aplikacji.
            </span>
          </label>

          {error && (
            <p role="alert" className="rounded-lg bg-anxious/10 px-3 py-2 text-sm text-anxious">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading || !consent} className="btn-primary w-full">
            {loading ? "Tworzenie konta…" : "Utwórz konto"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-navy-400">
          Masz już konto?{" "}
          <Link href="/login" className="font-medium text-navy-700 underline underline-offset-2">
            Zaloguj się
          </Link>
        </p>
      </div>
    </main>
  );
}
