import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { PatternsView } from "@/components/dashboard/PatternsView";

export default async function PatternsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboardingCompleted) redirect("/onboarding");

  const patterns = await prisma.pattern.findMany({ where: { userId: user.id }, orderBy: { lastSeenAt: "desc" } });

  return (
    <AppShell nick={user.nick}>
      <h1 className="font-display text-2xl text-navy-900">Wzorce w naszej relacji</h1>
      <p className="mt-1 max-w-xl text-sm text-navy-400">
        Potencjalnie powtarzające się schematy, zauważone na podstawie opisanych przez
        Ciebie sytuacji. To nie są wyroki — potraktuj je jako punkt wyjścia do refleksji.
        Nie każdy wzorzec jest problemem.
      </p>
      <PatternsView initialPatterns={patterns as any} />
    </AppShell>
  );
}
