import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-canvas px-6 py-12">
      <Link href="/" className="text-sm text-navy-400 hover:text-navy-700">← Strona główna</Link>
      <h1 className="mt-4 font-display text-2xl text-navy-900">Regulamin (Terms of Service)</h1>
      <p className="mt-1 text-xs text-navy-300">Wersja MVP — do uzupełnienia przez zespół prawny przed wdrożeniem produkcyjnym.</p>

      <div className="prose prose-sm mt-6 max-w-none space-y-4 text-sm leading-relaxed text-navy-700">
        <p>
          <strong>1. Czym jest Kompas Relacji.</strong> Aplikacja jest narzędziem
          edukacyjnym i wspierającym, które pomaga analizować sytuacje interpersonalne
          przy użyciu modelu AI oraz ogólnej wiedzy z zakresu psychologii relacji i
          teorii przywiązania.
        </p>
        <p>
          <strong>2. Czym Kompas Relacji NIE jest.</strong> Aplikacja nie jest usługą
          medyczną, psychoterapeutyczną ani diagnostyczną. Odpowiedzi generowane przez AI
          nie stanowią diagnozy psychologicznej ani psychiatrycznej i nie zastępują
          konsultacji z licencjonowanym specjalistą (psychologiem, psychoterapeutą,
          lekarzem). W sytuacjach kryzysowych, przemocy lub zagrożenia życia skontaktuj
          się z odpowiednimi służbami (patrz baner bezpieczeństwa w aplikacji).
        </p>
        <p>
          <strong>3. Konto użytkownika.</strong> Rejestrując się, oświadczasz, że
          podane dane (nick, hasło) są prawidłowe i że masz ukończone 18 lat lub zgodę
          opiekuna prawnego, jeśli wymaga tego prawo w Twojej jurysdykcji. Odpowiadasz za
          zachowanie poufności swojego hasła.
        </p>
        <p>
          <strong>4. Ograniczenie odpowiedzialności.</strong> Aplikacja jest dostarczana
          „tak jak jest” (as-is), bez gwarancji trafności, kompletności ani przydatności
          analiz generowanych przez AI do konkretnego celu. Decyzje dotyczące Twojego
          związku podejmujesz samodzielnie, na własną odpowiedzialność.
        </p>
        <p>
          <strong>5. Dopuszczalne użycie.</strong> Nie wolno wykorzystywać aplikacji do
          działań niezgodnych z prawem, do nękania innych osób, ani do prób obejścia
          mechanizmów bezpieczeństwa aplikacji.
        </p>
        <p>
          <strong>6. Zmiany regulaminu.</strong> Zastrzegamy sobie prawo do aktualizacji
          niniejszego regulaminu. O istotnych zmianach poinformujemy w aplikacji.
        </p>
        <p>
          To jest wersja przygotowana na potrzeby MVP i wymaga przeglądu prawnego przed
          wdrożeniem produkcyjnym, w tym dostosowania do jurysdykcji, w której aplikacja
          będzie oferowana.
        </p>
      </div>
    </main>
  );
}
