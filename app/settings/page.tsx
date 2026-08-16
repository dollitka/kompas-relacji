import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsPanel } from "@/components/dashboard/SettingsPanel";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboardingCompleted) redirect("/onboarding");

  const settings = await prisma.settings.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  return (
    <AppShell nick={user.nick}>
      <h1 className="font-display text-2xl text-navy-900">Ustawienia</h1>
      <SettingsPanel
        initialSettings={{ memoryEnabled: settings.memoryEnabled, aiAnalysisConsent: settings.aiAnalysisConsent }}
      />
    </AppShell>
  );
}
