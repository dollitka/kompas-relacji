import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { NewChatButton } from "@/components/chat/NewChatButton";
import { QuickActionGrid } from "@/components/chat/QuickActionGrid";
import { formatDateTime } from "@/lib/utils";

export default async function ChatListPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboardingCompleted) redirect("/onboarding");

  const conversations = await prisma.conversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true, _count: { select: { messages: true } } },
  });

  return (
    <AppShell nick={user.nick}>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl text-navy-900">Chat</h1>
        <NewChatButton />
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium text-navy-500">Zacznij od czegoś konkretnego</h2>
        <QuickActionGrid />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-navy-500">Poprzednie rozmowy</h2>
        {conversations.length === 0 ? (
          <p className="card p-6 text-sm text-navy-400">Nie masz jeszcze żadnych rozmów. Zacznij nową powyżej.</p>
        ) : (
          <div className="space-y-2">
            {conversations.map((c) => (
              <Link
                key={c.id}
                href={`/chat/${c.id}`}
                className="card flex items-center justify-between p-4 transition hover:border-lilac-300"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy-900">{c.title}</p>
                  <p className="text-xs text-navy-300">
                    {c._count.messages} wiadomości · {formatDateTime(c.updatedAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
