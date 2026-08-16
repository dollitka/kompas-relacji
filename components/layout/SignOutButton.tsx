"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-ghost w-full justify-start text-navy-400">
      Wyloguj się
    </button>
  );
}
