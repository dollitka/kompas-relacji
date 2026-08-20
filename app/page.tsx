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
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center px-6 py-16 text-center">
        {/* CZYM SIĘ ZAJMUJEMY */}
        <span className="pill mb-6 bg-lilac-100 text-navy-700">Prywatny asystent relacji</span>
        <h1 className="max-w-2xl font-display text-4xl font-medium leading-tight text-navy-900 sm:text-5xl">
          Zrozum swój związek zanim emocje podejmą decyzję za Ciebie.
        </h1>
        <p className="mt-5 max-w-xl text-balance text-base text-navy-500">
          Kompas Relacji to aplikacja, w której opisujesz sytuacje ze swojego związku —
          kłótnię, milczenie, coś, czego nie rozumiesz — a AI pomaga Ci spojrzeć na to z
          boku: co mogło się wydarzyć, jakie potrzeby i lęki mogły za tym stać, i co
          realnie możesz teraz zrobić. Bez oceniania i bez diagnoz, z pamięcią o tym, co
          już sobie powiedzieliście.
        </p>

        {/* DLA KOGO */}
        <section className="mt-12 w-full">
          <h2 className="font-display text-lg text-navy-900">Dla kogo jest ta aplikacja</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-navy-500">
            Dla każdego, niezależnie od płci — kobiet, mężczyzn i osób o dowolnej
            tożsamości płciowej. Dla związków heteroseksualnych, jednopłciowych i innych
            typów relacji romantycznych. Nie zakładamy z góry, jak "powinna" wyglądać
            Wasza relacja.
          </p>
        </section>

        {/* NA CZYM BAZUJEMY */}
        <section className="mt-8 w-full">
          <h2 className="font-display text-lg text-navy-900">Na czym to się opiera</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-navy-500">
            Analiza sytuacji jest oparta na psychologii relacji i teorii przywiązania
            (style: lękowy, unikający, bezpieczny — oraz ich mieszanki), a także na wiedzy
            o komunikacji, konfliktach i wzorcach zachowań. Rozmowy prowadzi model AI,
            dopasowując odpowiedzi do Twojego profilu i historii — zawsze rozróżniając
            fakty od hipotez.
          </p>
        </section>

        {/* CALL TO ACTION */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
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
          bezpieczeństwo. Szczegóły dotyczące przetwarzanych danych znajdziesz w{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-navy-700">
            Polityce prywatności
          </Link>
          .
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
