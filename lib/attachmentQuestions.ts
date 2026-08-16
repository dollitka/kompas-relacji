// ---------------------------------------------------------------------------
// Kwestionariusz orientacyjny stylu przywiązania. To narzędzie edukacyjne
// inspirowane ogólnie przyjętymi w psychologii wymiarami przywiązania
// (lęk / unikanie / bezpieczeństwo), NAPISANE OD PODSTAW na potrzeby tej
// aplikacji — nie jest kopią ani tłumaczeniem żadnego opublikowanego,
// zwalidowanego testu klinicznego (np. ECR). Wynik ma charakter orientacyjny
// i NIE jest diagnozą.
// ---------------------------------------------------------------------------

export type AttachmentDimension = "anxious" | "avoidant" | "secure";

export type AttachmentQuestion = {
  id: string;
  text: string;
  dimension: AttachmentDimension;
  reverse?: boolean; // jeśli true, wysoka wartość odpowiedzi obniża wynik wymiaru
};

export const ATTACHMENT_QUESTIONS: AttachmentQuestion[] = [
  // --- LĘK (anxious) ---
  { id: "a1", dimension: "anxious", text: "Często martwię się, że mój/a partner/ka przestanie mnie kochać." },
  { id: "a2", dimension: "anxious", text: "Kiedy partner/ka nie odpisuje przez dłuższy czas, zaczynam się niepokoić, że coś jest nie tak między nami." },
  { id: "a3", dimension: "anxious", text: "Potrzebuję częstych zapewnień, że jestem kochana/y i ważna/y." },
  { id: "a4", dimension: "anxious", text: "Boję się, że jestem bardziej zaangażowana/y w związek niż mój/a partner/ka." },
  { id: "a5", dimension: "anxious", text: "Kiedy czuję dystans ze strony partnera/ki, robię wszystko, żeby odzyskać bliskość." },
  { id: "a6", dimension: "anxious", text: "Analizuję wiadomości partnera/ki, szukając ukrytych sygnałów, że coś się zmieniło." },
  { id: "a7", dimension: "anxious", text: "Trudno mi się skupić na innych sprawach, gdy w związku dzieje się coś niepokojącego." },
  { id: "a8", dimension: "anxious", text: "Obawiam się, że zostanę porzucona/y, nawet gdy nic konkretnego na to nie wskazuje." },
  { id: "a9", dimension: "anxious", text: "Czasem naciskam na rozmowę, nawet gdy partner/ka wyraźnie potrzebuje przestrzeni." },
  { id: "a10", dimension: "anxious", text: "Moje samopoczucie mocno zależy od tego, jak układa się w danym momencie związek." },
  { id: "a11", dimension: "anxious", text: "Zdarza mi się wysyłać kilka wiadomości z rzędu, gdy nie dostaję szybkiej odpowiedzi." },
  { id: "a12", dimension: "anxious", text: "Łatwo interpretuję neutralne zachowanie partnera/ki jako oznakę odrzucenia." },

  // --- UNIKANIE (avoidant) ---
  { id: "v1", dimension: "avoidant", text: "Wolę radzić sobie z problemami sama/sam niż prosić partnera/kę o wsparcie." },
  { id: "v2", dimension: "avoidant", text: "Czuję dyskomfort, gdy partner/ka chce rozmawiać o uczuciach zbyt szczegółowo." },
  { id: "v3", dimension: "avoidant", text: "Kiedy pojawia się konflikt, mam ochotę się wycofać, zamiast go od razu rozwiązywać." },
  { id: "v4", dimension: "avoidant", text: "Cenię sobie niezależność w związku bardziej niż bliskość." },
  { id: "v5", dimension: "avoidant", text: "Trudno mi otwarcie mówić o swoich potrzebach emocjonalnych." },
  { id: "v6", dimension: "avoidant", text: "Kiedy partner/ka jest bardzo emocjonalna/y, czuję się przytłoczona/y i potrzebuję dystansu." },
  { id: "v7", dimension: "avoidant", text: "Wolę mieć dużo przestrzeni na własne sprawy, nawet kosztem czasu spędzanego razem." },
  { id: "v8", dimension: "avoidant", text: "Rzadko dzielę się z partnerem/ką tym, co mnie naprawdę martwi." },
  { id: "v9", dimension: "avoidant", text: "Bliskość emocjonalna bywa dla mnie bardziej męcząca niż przyjemna." },
  { id: "v10", dimension: "avoidant", text: "Kiedy ktoś zbyt mocno się do mnie zbliża, mam odruch, żeby się wycofać." },
  { id: "v11", dimension: "avoidant", text: "Wolę zakończyć trudną rozmowę szybko, nawet jeśli temat nie został w pełni wyjaśniony." },
  { id: "v12", dimension: "avoidant", text: "Rzadko proszę o pomoc, nawet gdy naprawdę jej potrzebuję." },

  // --- BEZPIECZEŃSTWO (secure) ---
  { id: "s1", dimension: "secure", text: "Czuję się swobodnie, dzieląc się z partnerem/ką swoimi emocjami." },
  { id: "s2", dimension: "secure", text: "Ufam, że partner/ka jest przy mnie, nawet gdy się nie widzimy przez jakiś czas." },
  { id: "s3", dimension: "secure", text: "Potrafię być blisko z partnerem/ką i jednocześnie zachować własną niezależność." },
  { id: "s4", dimension: "secure", text: "Konflikty w związku traktuję jako coś, co da się wspólnie rozwiązać." },
  { id: "s5", dimension: "secure", text: "Łatwo przychodzi mi prosić partnera/kę o wsparcie, gdy tego potrzebuję." },
  { id: "s6", dimension: "secure", text: "Nie panikuję, gdy partner/ka potrzebuje chwili przestrzeni dla siebie." },
  { id: "s7", dimension: "secure", text: "Wierzę, że mogę być sobą w związku, bez obawy o odrzucenie." },
  { id: "s8", dimension: "secure", text: "Potrafię wybaczać drobne błędy partnera/ki bez długotrwałej urazy." },
  { id: "s9", dimension: "secure", text: "Czuję się pewnie co do tego, że jestem ważna/y dla partnera/ki." },
  { id: "s10", dimension: "secure", text: "Rozmowa o trudnych tematach z partnerem/ką rzadko mnie przeraża." },
];

export const LIKERT_LABELS: Record<number, string> = {
  1: "zdecydowanie nie",
  2: "raczej nie",
  3: "trudno powiedzieć",
  4: "raczej tak",
  5: "zdecydowanie tak",
};

export type AttachmentAnswer = { questionId: string; value: number | null };

export type AttachmentScores = {
  anxiousScore: number;
  avoidantScore: number;
  secureScore: number;
};

/**
 * Liczy wynik 0-100 dla każdego z trzech wymiarów na podstawie odpowiedzi
 * 1-5. Pytania pominięte (value === null) są ignorowane w mianowniku danego
 * wymiaru, więc test da sensowny wynik nawet przy części pominiętych pytań.
 */
export function scoreAssessment(answers: AttachmentAnswer[]): AttachmentScores {
  const byDimension: Record<AttachmentDimension, number[]> = {
    anxious: [],
    avoidant: [],
    secure: [],
  };

  for (const answer of answers) {
    if (answer.value === null || answer.value === undefined) continue;
    const question = ATTACHMENT_QUESTIONS.find((q) => q.id === answer.questionId);
    if (!question) continue;
    const raw = question.reverse ? 6 - answer.value : answer.value;
    byDimension[question.dimension].push(raw);
  }

  const toPercent = (values: number[]) => {
    if (values.length === 0) return 0;
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length; // 1-5
    return Math.round(((avg - 1) / 4) * 100); // 0-100
  };

  return {
    anxiousScore: toPercent(byDimension.anxious),
    avoidantScore: toPercent(byDimension.avoidant),
    secureScore: toPercent(byDimension.secure),
  };
}

export function describeScores(scores: AttachmentScores): string {
  const parts: string[] = [];
  if (scores.secureScore >= 60) parts.push("wyraźne cechy stylu bezpiecznego");
  if (scores.anxiousScore >= 60) parts.push("silniejsze cechy lękowe");
  if (scores.avoidantScore >= 60) parts.push("silniejsze cechy unikające");
  if (parts.length === 0) return "Twój profil jest dość zrównoważony, bez silnej dominacji jednego wymiaru.";
  return `Twój profil pokazuje: ${parts.join(", ")}. Pamiętaj, że style przywiązania często się mieszają i mogą się zmieniać w czasie oraz zależnie od relacji.`;
}
