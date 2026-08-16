import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { AttachmentScoreBars } from "@/components/dashboard/AttachmentScoreBars";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboardingCompleted) redirect("/onboarding");

  const [profile, partner, assessment, topPattern, partnerMemories, openIssues, relationshipMemories] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: user.id } }),
    prisma.partner.findUnique({ where: { userId: user.id } }),
    prisma.attachmentAssessment.findFirst({ where: { userId: user.id }, orderBy: { completedAt: "desc" } }),
    prisma.pattern.findFirst({ where: { userId: user.id }, orderBy: { occurrences: "desc" } }),
    prisma.memory.findMany({ where: { userId: user.id, subject: "PARTNER", archived: false }, orderBy: { importance: "desc" }, take: 6 }),
    prisma.memory.findMany({ where: { userId: user.id, category: "OPEN_ISSUE", archived: false }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.memory.findMany({
      where: { userId: user.id, subject: "RELATIONSHIP", archived: false, category: { in: ["FACT", "INTERPRETATION"] } },
      orderBy: { importance: "desc" },
      take: 6,
    }),
  ]);

  return (
    <AppShell nick={user.nick}>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl text-navy-900">Profil relacji</h1>
      </div>

      <p className="mb-6 max-w-xl text-xs text-navy-300">
        To nie jest diagnoza ani absolutna prawda o Was — to obraz złożony z tego, co
        opisałeś/aś w rozmowach, oraz orientacyjnego testu przywiązania.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-navy-700">Twój styl przywiązania</h2>
            <Link href="/profile/test" className="text-xs text-navy-400 hover:text-navy-700 hover:underline">
              {assessment ? "Wykonaj ponownie" : "Wykonaj test"}
            </Link>
          </div>
          {assessment ? (
            <AttachmentScoreBars scores={assessment} />
          ) : (
            <p className="text-sm text-navy-300">Nie wykonano jeszcze testu.</p>
          )}
        </section>

        <section className="card p-6">
          <h2 className="mb-3 text-sm font-semibold text-navy-700">Możliwe cechy partnera/partnerki</h2>
          {partnerMemories.length === 0 ? (
            <p className="text-sm text-navy-300">Jeszcze za mało informacji — pojawią się po kolejnych rozmowach.</p>
          ) : (
            <ul className="space-y-2">
              {partnerMemories.map((m) => (
                <li key={m.id} className="text-sm leading-relaxed text-navy-600">{m.content}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <h2 className="mb-3 text-sm font-semibold text-navy-700">Najczęstszy cykl konfliktu</h2>
          {topPattern ? (
            <div>
              <p className="mb-2 text-sm font-medium text-navy-800">{topPattern.title}</p>
              <p className="mb-3 text-sm leading-relaxed text-navy-600">{topPattern.description}</p>
              {Array.isArray(topPattern.cycleSteps) && (topPattern.cycleSteps as string[]).length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {(topPattern.cycleSteps as string[]).map((step, i, arr) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="rounded-full bg-lilac-50 px-3 py-1.5 text-xs text-navy-700">{step}</span>
                      {i < arr.length - 1 && <span className="text-navy-300">→</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-navy-300">
              Brak jeszcze zidentyfikowanego cyklu. Przejdź do <Link href="/patterns" className="underline">Wzorców</Link>, aby uruchomić analizę.
            </p>
          )}
        </section>

        <section className="card p-6">
          <h2 className="mb-3 text-sm font-semibold text-navy-700">Otwarte problemy i potrzeby</h2>
          {profile?.topProblems && <p className="mb-2 text-sm text-navy-600"><span className="font-medium">Z onboardingu:</span> {profile.topProblems}</p>}
          {openIssues.length === 0 && !profile?.topProblems ? (
            <p className="text-sm text-navy-300">Brak zapisanych otwartych problemów.</p>
          ) : (
            <ul className="space-y-2">
              {openIssues.map((m) => (
                <li key={m.id} className="text-sm leading-relaxed text-navy-600">{m.content}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-navy-700">Obserwacje o relacji</h2>
          {relationshipMemories.length === 0 ? (
            <p className="text-sm text-navy-300">Jeszcze nic — pojawi się w miarę rozmów.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {relationshipMemories.map((m) => (
                <li key={m.id} className="rounded-lg bg-navy-50/50 px-3 py-2 text-sm leading-relaxed text-navy-600">{m.content}</li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6 card p-6">
        <h2 className="mb-3 text-sm font-semibold text-navy-700">Dane o związku (z onboardingu)</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <Row label="Rodzaj relacji" value={profile?.relationshipType} />
          <Row label="Partner/partnerka" value={partner?.name} />
          <Row label="Mieszkacie razem" value={profile?.livingTogether === null || profile?.livingTogether === undefined ? undefined : profile.livingTogether ? "Tak" : "Nie"} />
          <Row label="Ocena relacji (1-10)" value={profile?.relationshipRating?.toString()} />
        </dl>
      </section>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-navy-300">{label}</dt>
      <dd className="text-sm text-navy-700">{value || "—"}</dd>
    </div>
  );
}
