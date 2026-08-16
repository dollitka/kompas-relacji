"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QUICK_ACTIONS } from "@/lib/quickActions";

export function QuickActionGrid() {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleClick(actionId: string, title: string, starter: string) {
    setLoadingId(actionId);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: actionId, title }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/chat/${data.conversation.id}?draft=${encodeURIComponent(starter)}`);
      }
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.id}
          onClick={() => handleClick(action.id, action.label, action.starterMessage)}
          disabled={loadingId !== null}
          className="card p-4 text-left text-sm font-medium text-navy-700 transition hover:border-lilac-300 hover:bg-lilac-50 disabled:opacity-50"
        >
          {loadingId === action.id ? "Otwieranie…" : action.label}
        </button>
      ))}
    </div>
  );
}
