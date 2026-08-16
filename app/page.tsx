import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.onboardingCompleted ? "/dashboard" : "/onboarding");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-aurora">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
        <span className="pill mb-6 bg-lilac-100 text-navy-700">Prywatny asystent relacji</span>
        <h1 className="max-w-2xl font-display text-4xl font-medium leading-tight text-navy-900 sm:text-5xl">
          Zrozum swój związek zanim emocje podejmą decyzję za Ciebie.
        </h1>
        <p className="mt-5 max-w-xl text-balance text-base text-navy-500">
          Kompas Relacji pomaga Ci spojrzeć na konflikty, wzorce i potrzeby w związku
          przez pryzmat psychologii relacji i teorii przywiązania — bez oceniania,
          bez diagnoz, z pamięcią o tym, co już sobie powiedzieliście.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/register" className="btn-primary">
            Zacznij za darmo
          </Link>
          <Link href="/login" className="btn-secondary">
            Mam już konto
          </Link>
        </div>
        <p className="mt-10 max-w-lg text-xs leading-relaxed text-navy-300">
          Rozmowy są analizowane przez model AI, aby dopasować odpowiedzi i budować pamięć
          o Twojej relacji. To narzędzie edukacyjne i wspierające — nie zastępuje terapii
          ani pomocy specjalisty. W sytuacjach zagrożenia zawsze priorytetem jest Twoje
          bezpieczeństwo.
        </p>

        <footer className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-navy-400">
          <a href="mailto:krelacji@gmail.com" className="underline underline-offset-2 hover:text-navy-700">
            Kontakt: krelacji@gmail.com
          </a>
          <Link href="/privacy" className="underline underline-offset-2 hover:text-navy-700">
            Polityka prywatności
          </Link>
          <Link href="/terms" className="underline underline-offset-2 hover:text-navy-700">
            Regulamin
          </Link>
        </footer>
      </div>
    </main>
  );
}
