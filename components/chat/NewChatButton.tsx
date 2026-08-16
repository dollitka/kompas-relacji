"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewChatButton({ label = "+ Nowa rozmowa" }: { label?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/chat/${data.conversation.id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleClick} disabled={loading} className="btn-primary">
      {loading ? "Tworzenie…" : label}
    </button>
  );
}
