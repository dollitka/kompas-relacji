import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.onboardingCompleted) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-aurora">
      <OnboardingFlow />
    </main>
  );
}
