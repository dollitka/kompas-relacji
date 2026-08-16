import Link from "next/link";
import { SignOutButton } from "@/components/layout/SignOutButton";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "◈" },
  { href: "/chat", label: "Chat", icon: "◍" },
  { href: "/patterns", label: "Wzorce", icon: "◐" },
  { href: "/memory", label: "Pamięć", icon: "◇" },
  { href: "/profile", label: "Profil", icon: "◑" },
  { href: "/settings", label: "Ustawienia", icon: "◒" },
];

export function AppShell({ nick, children }: { nick: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <aside className="border-b border-navy-100 bg-white/70 backdrop-blur-sm lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-4 lg:block lg:px-6 lg:py-6">
          <Link href="/dashboard" className="font-display text-lg text-navy-900">
            Kompas Relacji
          </Link>
          <span className="text-xs text-navy-300 lg:mt-1 lg:block">Cześć, {nick}</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:gap-0.5 lg:px-3 lg:pb-6">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-navy-500 transition hover:bg-navy-50 hover:text-navy-900"
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden px-6 pb-6 lg:block">
          <SignOutButton />
        </div>
      </aside>
      <div className="flex-1">
        <div className="mx-auto max-w-4xl px-5 py-8 lg:px-10 lg:py-10">{children}</div>
        <div className="px-5 pb-8 lg:hidden">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
