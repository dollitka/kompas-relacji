"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

type ShareItem = { id: string; content: string; category: string; createdAt: string };

const CATEGORY_LABELS: Record<string, string> = {
  FACT: "Fakt",
  INTERPRETATION: "Interpretacja AI",
};

export function PartnerLinkManager() {
  const [loading, setLoading] = useState(true);
  const [linked, setLinked] = useState(false);
  const [partnerNick, setPartnerNick] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [pending, setPending] = useState<ShareItem[]>([]);
  const [sharedByMe, setSharedByMe] = useState<ShareItem[]>([]);
  const [sharedByPartner, setSharedByPartner] = useState<ShareItem[]>([]);

  async function loadStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/partner/status");
      const data = await res.json();
      setLinked(Boolean(data.linked));
      setPartnerNick(data.partnerNick ?? null);
      if (data.linked) {
        await Promise.all([loadPending(), loadSharedByMe(), loadSharedByPartner()]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadPending() {
    const res = await fetch("/api/partner/shares");
    const data = await res.json();
    if (res.ok) setPending(data.pending ?? []);
  }
  async function loadSharedByMe() {
    const res = await fetch("/api/partner/shared-by-me");
    const data = await res.json();
    if (res.ok) setSharedByMe(data.shared ?? []);
  }
  async function loadSharedByPartner() {
    const res = await fetch("/api/partner/shared-by-partner");
    const data = await res.json();
    if (res.ok) setSharedByPartner(data.shared ?? []);
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function handleGenerateInvite() {
    if (!consent) {
      setError("Zaznacz zgodę poniżej, żeby wygenerować kod.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/partner/invite", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Nie udało się wygenerować kodu.");
        return;
      }
      setInviteCode(data.inviteCode);
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    if (!consent) {
      setError("Zaznacz zgodę poniżej, żeby połączyć konta.");
      return;
    }
    if (!joinCode.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/partner/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Nie udało się połączyć kont.");
        return;
      }
      setMessage("Połączono konta!");
      await loadStatus();
    } finally {
      setBusy(false);
    }
  }

  async function handleUnlink() {
    if (!confirm("Na pewno chcesz rozłączyć konta? Od tej chwili żadne nowe wnioski nie będą się już wymieniać między Wami.")) return;
    setBusy(true);
    try {
      await fetch("/api/partner/unlink", { method: "POST" });
      setInviteCode(null);
      setJoinCode("");
      setConsent(false);
      await loadStatus();
    } finally {
      setBusy(false);
    }
  }

  async function handleDecision(id: string, decision: "approve" | "decline") {
    setBusy(true);
    try {
      const res = await fetch(`/api/partner/shares/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (res.ok) {
        setPending((prev) => prev.filter((p) => p.id !== id));
        if (decision === "approve") await loadSharedByMe();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/partner/shares/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "revoke" }),
      });
      if (res.ok) setSharedByMe((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="mt-6 text-sm text-navy-400">Wczytywanie…</p>;
  }

  return (
    <div className="mt-6 max-w-2xl space-y-6">
      {message && <p className="rounded-lg bg-secure/10 px-3 py-2 text-sm text-secure">{message}</p>}
      {error && <p role="alert" className="rounded-lg bg-anxious/10 px-3 py-2 text-sm text-anxious">{error}</p>}

      {!linked ? (
        <section className="card space-y-5 p-6">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-navy-700">Status: niepołączone</h2>
            <p className="text-sm text-navy-500">
              Możesz wygenerować kod dla partnera/ki, albo wpisać kod, który dostałaś/eś od niego/niej.
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-navy-50/50 p-3">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-navy-700"
            />
            <span className="text-xs leading-relaxed text-navy-600">
              Rozumiem, że po połączeniu kont, wybrane przeze mnie ogólne wnioski o naszej
              relacji (nigdy treść moich rozmów) mogą, za moją każdorazową zgodą, stać się
              widoczne dla AI mojego partnera/partnerki — i odwrotnie. Zawsze decyduję
              osobno o każdym udostępnieniu i mogę rozłączyć konta w dowolnym momencie.
              Więcej w{" "}
              <Link href="/privacy" target="_blank" className="underline underline-offset-2">
                Polityce prywatności
              </Link>
              .
            </span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-navy-100 p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">Zaproś partnera/kę</h3>
              {inviteCode ? (
                <div>
                  <p className="mb-1 text-xs text-navy-400">Przekaż ten kod partnerowi/ce (poza aplikacją):</p>
                  <p className="rounded-lg bg-navy-50 px-3 py-2 text-center font-mono text-lg tracking-widest text-navy-900">{inviteCode}</p>
                </div>
              ) : (
                <button onClick={handleGenerateInvite} disabled={busy} className="btn-secondary w-full">
                  Wygeneruj kod
                </button>
              )}
            </div>

            <div className="rounded-xl border border-navy-100 p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">Mam kod od partnera/ki</h3>
              <input
                className="input-field mb-2 text-center font-mono uppercase tracking-widest"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="np. AB3D9F2K"
                maxLength={12}
              />
              <button onClick={handleJoin} disabled={busy || !joinCode.trim()} className="btn-primary w-full">
                Połącz konta
              </button>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="card p-6">
            <h2 className="mb-1 text-sm font-semibold text-navy-700">Status: połączone</h2>
            <p className="mb-4 text-sm text-navy-500">
              Twoje konto jest połączone z: <span className="font-medium text-navy-800">{partnerNick ?? "partnerem/ką"}</span>
            </p>
            <button onClick={handleUnlink} disabled={busy} className="btn-secondary border-anxious/30 text-anxious hover:bg-anxious/5">
              Rozłącz konta
            </button>
          </section>

          <section className="card p-6">
            <h2 className="mb-3 text-sm font-semibold text-navy-700">
              Do zatwierdzenia {pending.length > 0 && <span className="pill ml-1 bg-lilac-100 text-navy-700">{pending.length}</span>}
            </h2>
            {pending.length === 0 ? (
              <p className="text-sm text-navy-300">Nic obecnie nie czeka na Twoją decyzję.</p>
            ) : (
              <div className="space-y-3">
                {pending.map((p) => (
                  <div key={p.id} className="rounded-lg border border-navy-100 p-4">
                    <span className="pill mb-2 inline-block bg-navy-50 text-navy-700">{CATEGORY_LABELS[p.category] ?? p.category}</span>
                    <p className="mb-3 text-sm leading-relaxed text-navy-800">{p.content}</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleDecision(p.id, "approve")} disabled={busy} className="btn-primary">
                        Udostępnij
                      </button>
                      <button onClick={() => handleDecision(p.id, "decline")} disabled={busy} className="btn-secondary">
                        Nie udostępniaj
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card p-6">
            <h2 className="mb-3 text-sm font-semibold text-navy-700">Co udostępniłam/em partnerowi/ce</h2>
            {sharedByMe.length === 0 ? (
              <p className="text-sm text-navy-300">Nic jeszcze nie udostępniłaś/eś.</p>
            ) : (
              <div className="space-y-2">
                {sharedByMe.map((s) => (
                  <div key={s.id} className="flex items-start justify-between gap-3 rounded-lg bg-navy-50/50 px-3 py-2">
                    <div>
                      <p className="text-sm text-navy-700">{s.content}</p>
                      <p className="text-xs text-navy-300">{formatDate(s.createdAt)}</p>
                    </div>
                    <button onClick={() => handleRevoke(s.id)} disabled={busy} className="shrink-0 text-xs text-anxious hover:underline">
                      Cofnij
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card p-6">
            <h2 className="mb-3 text-sm font-semibold text-navy-700">Co partner/ka udostępnił/a</h2>
            {sharedByPartner.length === 0 ? (
              <p className="text-sm text-navy-300">Partner/ka jeszcze nic nie udostępnił/a.</p>
            ) : (
              <div className="space-y-2">
                {sharedByPartner.map((s) => (
                  <div key={s.id} className="rounded-lg bg-navy-50/50 px-3 py-2">
                    <p className="text-sm text-navy-700">{s.content}</p>
                    <p className="text-xs text-navy-300">{formatDate(s.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
