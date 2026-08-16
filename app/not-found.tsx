import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
      <h1 className="font-display text-2xl text-navy-900">Nie znaleziono strony</h1>
      <p className="text-sm text-navy-400">Ta strona nie istnieje albo nie masz do niej dostępu.</p>
      <Link href="/dashboard" className="btn-primary">Wróć do panelu</Link>
    </main>
  );
}
