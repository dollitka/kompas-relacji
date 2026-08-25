import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { QuickActionGrid } from "@/components/chat/QuickActionGrid";
import { AttachmentScoreBars } from "@/components/dashboard/AttachmentScoreBars";
import { formatDateTime, formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboardingCompleted) redirect("/onboarding");

  const [conversations, patterns, events, assessment, observations, pendingShareCount] = await Promise.all([
    prisma.conversation.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 3 }),
    prisma.pattern.findMany({ where: { userId: user.id }, orderBy: { lastSeenAt: "desc" }, take: 3 }),
    prisma.importantEvent.findMany({ where: { userId: user.id }, orderBy: { eventDate: "desc" }, take: 3 }),
    prisma.attachmentAssessment.findFirst({ where: { userId: user.id }, orderBy: { completedAt: "desc" } }),
    prisma.memory.findMany({
      where: { userId: user.id, archived: false, category: "INTERPRETATION" },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.memory.count({ where: { userId: user.id, shareStatus: "PENDING", archived: false } }),
  ]);

  return (
    <AppShell nick={user.nick}>
      {pendingShareCount > 0 && (
        <Link
          href="/partner"
          className="mb-6 flex items-center justify-between rounded-xl2 border border-lilac-200 bg-lilac-50 px-4 py-3 text-sm text-navy-700 transition hover:bg-lilac-100"
        >
          <span>
            Masz {pendingShareCount} {pendingShareCount === 1 ? "wniosek" : "wnioski"} do zatwierdzenia w zakładce Partner
          </span>
          <span aria-hidden>→</span>
        </Link>
      )}

      <h1 className="font-display text-2xl text-navy-900">Cześć, {user.nick}.</h1>
      <p className="mt-1 text-sm text-navy-400">Jak mogę Ci dzisiaj pomóc?</p>

      <section className="mt-6">
        <QuickActionGrid />
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-navy-700">Ostatnie rozmowy</h2>
            <Link href="/chat" className="text-xs text-navy-400 hover:text-navy-700">Zobacz wszystkie</Link>
          </div>
          {conversations.length === 0 ? (
            <p className="text-sm text-navy-300">Brak rozmów — zacznij od szybkiej akcji powyżej.</p>
          ) : (
            <ul className="space-y-2">
              {conversations.map((c) => (
                <li key={c.id}>
                  <Link href={`/chat/${c.id}`} className="block truncate text-sm text-navy-700 hover:text-navy-900 hover:underline">
                    {c.title}
                  </Link>
                  <span className="text-xs text-navy-300">{formatDateTime(c.updatedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-navy-700">Ostatnio zauważone wzorce</h2>
            <Link href="/patterns" className="text-xs text-navy-400 hover:text-navy-700">Zobacz wszystkie</Link>
          </div>
          {patterns.length === 0 ? (
            <p className="text-sm text-navy-300">Wzorce pojawią się, gdy opiszesz więcej sytuacji.</p>
          ) : (
            <ul className="space-y-3">
              {patterns.map((p) => (
                <li key={p.id}>
                  <p className="text-sm font-medium text-navy-700">{p.title}</p>
                  <p className="text-xs text-navy-400">zaobserwowano {p.occurrences}×</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-3 text-sm font-medium text-navy-700">Ważne wydarzenia</h2>
          {events.length === 0 ? (
            <p className="text-sm text-navy-300">Brak zapisanych wydarzeń.</p>
          ) : (
            <ul className="space-y-2">
              {events.map((e) => (
                <li key={e.id} className="text-sm text-navy-700">
                  <span className="font-medium">{e.title}</span>{" "}
                  <span className="text-xs text-navy-300">— {formatDate(e.eventDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-3 text-sm font-medium text-navy-700">Ostatnie obserwacje AI</h2>
          {observations.length === 0 ? (
            <p className="text-sm text-navy-300">Jeszcze nic — pojawi się po kilku rozmowach.</p>
          ) : (
            <ul className="space-y-2">
              {observations.map((o) => (
                <li key={o.id} className="text-sm leading-relaxed text-navy-600">
                  {o.content}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6 card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-navy-700">Aktualny profil relacji</h2>
          <Link href="/profile" className="text-xs text-navy-400 hover:text-navy-700">Pełny profil</Link>
        </div>
        {assessment ? (
          <AttachmentScoreBars scores={assessment} showDescription={false} />
        ) : (
          <p className="text-sm text-navy-300">
            Nie masz jeszcze wyniku testu stylu przywiązania. <Link href="/profile" className="underline">Wykonaj test</Link>.
          </p>
        )}
      </section>
    </AppShell>
  );
}
