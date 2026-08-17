import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-canvas px-6 py-12">
      <Link href="/" className="text-sm text-navy-400 hover:text-navy-700">← Strona główna</Link>
      <h1 className="mt-4 font-display text-2xl text-navy-900">Polityka prywatności</h1>
      <p className="mt-1 text-xs text-navy-300">Wersja MVP — do uzupełnienia przez zespół prawny przed wdrożeniem produkcyjnym.</p>

      <div className="prose prose-sm mt-6 max-w-none space-y-4 text-sm leading-relaxed text-navy-700">
        <p>
          Kompas Relacji to aplikacja pomagająca analizować sytuacje w związkach przy
          użyciu modelu AI. Przechowujemy dane niezbędne do działania aplikacji: Twój
          nick i hasło (zahashowane), treść rozmów, wyodrębnioną pamięć o Tobie, Twoim
          partnerze/partnerce i relacji, wyniki testu stylu przywiązania oraz podstawowe
          ustawienia konta.
        </p>
        <p>
          <strong>Analiza przez AI.</strong> Treść Twoich wiadomości jest przesyłana do
          zewnętrznego dostawcy modelu AI (Google Gemini) w celu wygenerowania odpowiedzi oraz
          zaproponowania informacji do zapamiętania. Na darmowym planie Gemini API Google
          może wykorzystywać treść zapytań do ulepszania swoich produktów — to ważna różnica
          względem płatnych planów AI, o której chcemy Cię uczciwie poinformować. Nie
          przekazujemy Twoich danych innym podmiotom poza tymi niezbędnymi do działania
          aplikacji (dostawca modelu AI, dostawca bazy danych/hostingu).
        </p>
        <p>
          <strong>Kontrola nad pamięcią.</strong> W zakładce „Pamięć” możesz w każdej
          chwili zobaczyć, co aplikacja o Tobie zapamiętała, edytować lub usunąć
          pojedyncze wpisy, wyłączyć zapisywanie nowej pamięci lub wyczyścić ją całą.
        </p>
        <p>
          <strong>Usunięcie konta.</strong> W Ustawieniach możesz trwale usunąć konto wraz
          ze wszystkimi powiązanymi danymi (rozmowy, pamięć, wzorce, wyniki testów).
          Usunięcie jest nieodwracalne.
        </p>
        <p>
          <strong>Minimalizacja danych.</strong> Staramy się przechowywać tylko te dane,
          które są potrzebne do działania funkcji pamięci i analizy wzorców. Nie zbieramy
          prawdziwego imienia ani adresu e-mail przy rejestracji.
        </p>
        <p>
          Nie gwarantujemy „100% prywatności” ani nieprzenikalności systemów — jak każda
          aplikacja internetowa, korzystamy z zewnętrznych dostawców infrastruktury
          (hosting, baza danych, dostawca modelu AI) i podlegamy standardowym ryzykom
          bezpieczeństwa właściwym dla usług online.
        </p>
        <p>
          To jest wersja przygotowana na potrzeby MVP. Przed wdrożeniem produkcyjnym
          treść tej polityki powinna zostać zweryfikowana przez prawnika, w szczególności
          pod kątem RODO/GDPR, podstaw prawnych przetwarzania danych szczególnej
          kategorii (dane dotyczące życia intymnego/relacji) oraz umów powierzenia danych
          z dostawcami zewnętrznymi.
        </p>
      </div>
    </main>
  );
}
