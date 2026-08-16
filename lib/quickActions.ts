// ---------------------------------------------------------------------------
// Szybkie akcje / tryby rozpoczynania rozmowy (sekcja 9 specyfikacji).
// Kliknięcie otwiera nowy chat z gotową pierwszą wiadomością użytkownika,
// a tryb (mode) trafia też do system promptu jako wskazówka kontekstu.
// ---------------------------------------------------------------------------

export type QuickAction = {
  id: string;
  label: string;
  starterMessage: string;
};

export const QUICK_ACTIONS: QuickAction[] = [
  { id: "conflict", label: "Pokłóciliśmy się", starterMessage: "Pokłóciliśmy się i chciał(a)bym to razem przeanalizować." },
  { id: "cant_understand", label: "Nie rozumiem jego/jej zachowania", starterMessage: "Nie rozumiem, dlaczego mój/a partner/ka tak się zachował/a." },
  { id: "what_to_reply", label: "Nie wiem, co odpisać", starterMessage: "Dostałem/am wiadomość i nie wiem, jak na nią odpowiedzieć." },
  { id: "what_now", label: "Co mam teraz zrobić?", starterMessage: "Nie wiem, co powinienem/powinnam teraz zrobić w tej sytuacji." },
  { id: "am_i_overreacting", label: "Czy przesadzam?", starterMessage: "Zastanawiam się, czy moja reakcja na to, co się stało, jest przesadzona." },
  { id: "understand_my_reaction", label: "Pomóż mi zrozumieć moją reakcję", starterMessage: "Chciał(a)bym lepiej zrozumieć, dlaczego zareagowałem/am tak, jak zareagowałem/am." },
  { id: "understand_their_reaction", label: "Pomóż mi zrozumieć jego/jej reakcję", starterMessage: "Chciał(a)bym lepiej zrozumieć reakcję mojego/mojej partnera/ki." },
  { id: "analyze_conflict", label: "Przeanalizuj nasz konflikt", starterMessage: "Chciał(a)bym, żebyś przeanalizował/a nasz ostatni konflikt." },
  { id: "find_pattern", label: "Znajdź powtarzający się wzorzec", starterMessage: "Czy widzisz jakiś powtarzający się wzorzec w tym, co Ci opisuję o naszej relacji?" },
];
