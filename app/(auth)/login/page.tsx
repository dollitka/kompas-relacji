"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { nick, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Nieprawidłowy nick lub hasło.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-aurora px-6">
      <div className="card w-full max-w-sm p-8">
        <h1 className="font-display text-2xl text-navy-900">Witaj z powrotem</h1>
        <p className="mt-1 text-sm text-navy-400">Zaloguj się, aby wrócić do swojego kompasu.</p>

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
              autoComplete="username"
              required
            />
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
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-anxious/10 px-3 py-2 text-sm text-anxious">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Logowanie…" : "Zaloguj się"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-navy-400">
          Nie masz jeszcze konta?{" "}
          <Link href="/register" className="font-medium text-navy-700 underline underline-offset-2">
            Zarejestruj się
          </Link>
        </p>
      </div>
    </main>
  );
}
