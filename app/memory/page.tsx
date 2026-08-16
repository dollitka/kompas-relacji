import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { MemoryManager } from "@/components/dashboard/MemoryManager";

export default async function MemoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboardingCompleted) redirect("/onboarding");

  const memories = await prisma.memory.findMany({
    where: { userId: user.id, archived: false },
    orderBy: [{ subject: "asc" }, { importance: "desc" }, { createdAt: "desc" }],
  });

  return (
    <AppShell nick={user.nick}>
      <h1 className="font-display text-2xl text-navy-900">Moja pamięć</h1>
      <p className="mt-1 max-w-xl text-sm text-navy-400">
        To, co aplikacja zapamiętała z Waszych rozmów. Możesz edytować lub usunąć każdy wpis,
        albo wyczyścić całą pamięć naraz. Usunięte informacje nie będą już używane w rozmowach z AI.
      </p>

      <div className="mt-6">
        <MemoryManager initialMemories={memories as any} />
      </div>
    </AppShell>
  );
}
