"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pl">
      <body className="flex min-h-screen items-center justify-center bg-canvas px-6">
        <div className="card max-w-sm p-8 text-center">
          <h1 className="font-display text-xl text-navy-900">Coś poszło nie tak</h1>
          <p className="mt-2 text-sm text-navy-500">
            Wystąpił nieoczekiwany błąd. Spróbuj ponownie — jeśli problem się powtarza,
            odśwież stronę.
          </p>
          <button onClick={() => reset()} className="btn-primary mt-6">
            Spróbuj ponownie
          </button>
        </div>
      </body>
    </html>
  );
}
