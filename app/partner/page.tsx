import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AppShell } from "@/components/layout/AppShell";
import { PartnerLinkManager } from "@/components/dashboard/PartnerLinkManager";

export default async function PartnerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboardingCompleted) redirect("/onboarding");

  return (
    <AppShell nick={user.nick}>
      <h1 className="font-display text-2xl text-navy-900">Połączenie z partnerem/ką</h1>
      <p className="mt-1 max-w-xl text-sm text-navy-400">
        Opcjonalna funkcja: możecie połączyć konta, żeby AI brało pod uwagę Waszą relację
        z obu perspektyw. Wasze wiadomości NIGDY nie są sobie nawzajem pokazywane — tylko
        ogólne wnioski o relacji, i tylko te, które sami jawnie zatwierdzicie.
      </p>
      <PartnerLinkManager />
    </AppShell>
  );
}
