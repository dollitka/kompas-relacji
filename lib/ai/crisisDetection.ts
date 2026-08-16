// ---------------------------------------------------------------------------
// Prosta, jawna (nie-AI) warstwa bezpieczeństwa działająca RÓWNOLEGLE do
// instrukcji w system prompcie. Nie zastępuje osądu modelu — jest dodatkową
// siatką bezpieczeństwa, która niezależnie od odpowiedzi AI pokazuje
// użytkownikowi zasoby pomocowe, gdy wiadomość zawiera sygnały przemocy,
// gróźb, stalkingu lub bezpośredniego zagrożenia.
//
// To NIE jest klasyfikator kliniczny. To celowo szeroka, "lepiej za dużo niż
// za mało" lista wyzwalaczy — fałszywe trafienia są tanie (pokazujemy baner
// z zasobami), a pominięcia mogą być kosztowne.
// ---------------------------------------------------------------------------

const CRISIS_KEYWORDS: string[] = [
  "przemoc",
  "bije mnie",
  "uderzył",
  "uderzyła",
  "pobił",
  "pobiła",
  "grozi mi",
  "groził",
  "groziła",
  "groźby",
  "boję się o swoje życie",
  "boję się go",
  "boję się jej",
  "stalkuje",
  "śledzi mnie",
  "nie mogę wyjść z domu",
  "zamyka mnie",
  "zabiera mi telefon",
  "izoluje mnie",
  "zmusza mnie",
  "zmusił mnie",
  "gwałt",
  "wykorzystał mnie",
  "wykorzystała mnie",
  "chce mnie zabić",
  "zabije mnie",
  "boję się wracać do domu",
  "nie czuję się bezpiecznie",
  "przemoc domowa",
];

const SELF_HARM_KEYWORDS: string[] = [
  "chcę umrzeć",
  "nie chcę żyć",
  "myślę o samobójstwie",
  "chcę się zabić",
  "nie widzę sensu życia",
  "skrzywdzić się",
  "samookaleczenie",
];

export type CrisisCheckResult = {
  isCrisis: boolean;
  type: "violence" | "self_harm" | null;
};

export function checkCrisisSignals(text: string): CrisisCheckResult {
  const normalized = text.toLowerCase();

  if (SELF_HARM_KEYWORDS.some((kw) => normalized.includes(kw))) {
    return { isCrisis: true, type: "self_harm" };
  }
  if (CRISIS_KEYWORDS.some((kw) => normalized.includes(kw))) {
    return { isCrisis: true, type: "violence" };
  }
  return { isCrisis: false, type: null };
}

export const CRISIS_RESOURCES_VIOLENCE = `Jeśli jesteś w bezpośrednim niebezpieczeństwie, zadzwoń pod **112**.

Dodatkowe wsparcie w Polsce:
- **800 120 002** — Ogólnopolskie Pogotowie dla Ofiar Przemocy w Rodzinie „Niebieska Linia" (całodobowo, bezpłatnie)
- **116 123** — Telefon Zaufania dla Osób Dorosłych w Kryzysie Emocjonalnym
- **112** — numer alarmowy w sytuacji bezpośredniego zagrożenia

Nie musisz przechodzić przez to sama/sam. Rozmowa z osobą przeszkoloną w tych sprawach może pomóc Ci ocenić sytuację i możliwe kroki bezpieczniej niż rozmowa ze mną.`;

export const CRISIS_RESOURCES_SELF_HARM = `Jeśli myślisz o odebraniu sobie życia lub o skrzywdzeniu siebie, nie zostawaj z tym sama/sam.

- **116 123** — Telefon Zaufania dla Osób Dorosłych w Kryzysie Emocjonalnym (bezpłatnie)
- **112** — numer alarmowy, jeśli jesteś w bezpośrednim niebezpieczeństwie
- Możesz też zgłosić się na najbliższy SOR (szpitalny oddział ratunkowy)

Chętnie z Tobą porozmawiam o tym, co się dzieje, ale nie zastąpię pomocy specjalisty — a w tej sytuacji zasługujesz na kogoś, kto może być przy Tobie realnie i od razu.`;
