# Kompas Relacji — AI Relationship Analyst

Prywatny asystent AI pomagający lepiej rozumieć konflikty, wzorce komunikacji i style
przywiązania w związku. Analizuje opisane sytuacje przez pryzmat psychologii relacji —
**nie diagnozuje** i nie zastępuje terapeuty.

> ⚠️ To narzędzie edukacyjne i wspierające. W sytuacjach przemocy, gróźb, stalkingu lub
> bezpośredniego zagrożenia aplikacja pokazuje baner z numerami pomocy (patrz sekcja
> [Bezpieczeństwo](#bezpieczeństwo)), ale nie zastępuje kontaktu ze służbami.

## Spis treści

- [Funkcje](#funkcje)
- [Stack technologiczny](#stack-technologiczny)
- [Wymagania](#wymagania)
- [Instalacja lokalna](#instalacja-lokalna)
- [Konfiguracja `.env`](#konfiguracja-env)
- [Baza danych i migracje](#baza-danych-i-migracje)
- [Dane demo](#dane-demo)
- [Konfiguracja AI API](#konfiguracja-ai-api)
- [Uruchomienie lokalne](#uruchomienie-lokalne)
- [Deployment na Vercel](#deployment-na-vercel)
- [Struktura projektu](#struktura-projektu)
- [Bezpieczeństwo](#bezpieczeństwo)
- [Co jest zaimplementowane, a co pozostaje do zrobienia](#status-implementacji)

## Funkcje

- **Onboarding** (4 kroki): powitanie, dane o użytkowniku/partnerze, dane o związku,
  test stylu przywiązania.
- **Test stylu przywiązania** — 30 oryginalnych pytań (nie kopia opublikowanych
  narzędzi klinicznych), skala 1–5 z możliwością pominięcia, wynik 0–100% dla trzech
  wymiarów: lękowy / unikający / bezpieczny.
- **Chat z AI Relationship Analyst** — z pamięcią kontekstu użytkownika, partnera,
  relacji i historii rozmowy. 9 szybkich akcji startowych.
- **Pamięć długoterminowa** — automatyczna ekstrakcja faktów/interpretacji/wzorców/
  wydarzeń/otwartych problemów po każdej turze rozmowy, w pełni widoczna i edytowalna
  przez użytkownika w zakładce „Pamięć” (podgląd, edycja, usuwanie pojedyncze i
  zbiorcze).
- **Analiza wzorców** — na żądanie użytkownika AI analizuje zebraną pamięć i wskazuje
  powtarzające się cykle (np. pursue/withdraw) z wizualizacją kroków cyklu.
- **Dashboard** i **Profil relacji** — podsumowanie stylu przywiązania, cech partnera,
  najczęstszego cyklu konfliktu, otwartych problemów.
- **Bezpieczeństwo** — dwuwarstwowa detekcja sygnałów przemocy/zagrożenia
  (jawna lista słów kluczowych + instrukcje w system prompcie AI), baner z numerami
  pomocy.
- **Konto** oparte o nick + hasło (bcrypt), bez wymogu prawdziwego imienia/e-maila.
- **Ustawienia prywatności** — możliwość wyłączenia zapisywania nowej pamięci,
  wyczyszczenia całej pamięci, usunięcia konta wraz ze wszystkimi danymi.

## Stack technologiczny

- Next.js 14 (App Router) + TypeScript + React 18
- Tailwind CSS (custom design tokens, bez zewnętrznej biblioteki komponentów)
- PostgreSQL + Prisma ORM
- NextAuth.js (Credentials Provider, JWT sessions)
- Anthropic Claude API (wywoływane wyłącznie po stronie serwera)
- Zod do walidacji danych wejściowych

## Wymagania

- Node.js 18.17+ (zalecane 20 LTS)
- Baza PostgreSQL (lokalnie, w Dockerze, lub hostowana — np. Neon, Supabase, Railway,
  Vercel Postgres)
- Klucz API Anthropic (https://console.anthropic.com)

## Instalacja lokalna

```bash
git clone <adres-twojego-repo>
cd relationship-compass
npm install
```

## Konfiguracja `.env`

Skopiuj plik przykładowy i uzupełnij wartości:

```bash
cp .env.example .env
```

| Zmienna            | Opis                                                                 |
|--------------------|-----------------------------------------------------------------------|
| `DATABASE_URL`     | Connection string do PostgreSQL                                       |
| `NEXTAUTH_SECRET`  | Losowy sekret: `openssl rand -base64 32`                              |
| `NEXTAUTH_URL`     | Adres aplikacji (`http://localhost:3000` lokalnie)                    |
| `ANTHROPIC_API_KEY`| Klucz API Anthropic — **nigdy nie commituj go do repo**               |
| `ANTHROPIC_MODEL`  | Opcjonalnie: nazwa modelu (domyślnie `claude-sonnet-4-5-20250929`)     |

## Baza danych i migracje

```bash
npx prisma generate
npx prisma migrate dev --name init
```

To utworzy wszystkie tabele opisane w `prisma/schema.prisma` (User, Profile, Partner,
Conversation, Message, Memory, Pattern, ImportantEvent, AttachmentAssessment, Settings).

## Dane demo

Opcjonalny użytkownik demonstracyjny (osobne konto, nigdy nie miesza się z prawdziwymi
użytkownikami):

```bash
npm run seed
```

Zaloguj się nickiem `demo` i hasłem `DemoHaslo123` (zmień/usuń to konto przed
wdrożeniem produkcyjnym).

## Konfiguracja AI API

Aplikacja wywołuje Anthropic Messages API wyłącznie z API routes (`lib/ai/client.ts`) —
klucz `ANTHROPIC_API_KEY` nigdy nie trafia do przeglądarki. Jeśli klucz nie jest
ustawiony, chat zwróci czytelny komunikat błędu zamiast się wywalić.

## Uruchomienie lokalne

```bash
npm run dev
```

Aplikacja będzie dostępna pod `http://localhost:3000`.

## Deployment na Vercel

1. Wypchnij repozytorium na GitHub.
2. W Vercel: **New Project → Import** wskazane repozytorium.
3. Ustaw zmienne środowiskowe z `.env.example` w **Project Settings → Environment
   Variables** (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` — ustaw na Twoją
   domenę Vercel, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`).
4. Upewnij się, że baza PostgreSQL jest dostępna z internetu (np. Neon/Supabase) —
   Vercel serverless functions nie mają dostępu do lokalnej bazy danych.
5. Build command (`npm run build`) automatycznie uruchamia `prisma generate`.
   Migracje bazy uruchom ręcznie przed pierwszym deployem: `npx prisma migrate deploy`
   (lokalnie, wskazując na produkcyjny `DATABASE_URL`, lub jako krok w CI).
6. Deploy.

## Struktura projektu

```
/app                    # Next.js App Router: strony i API routes
  /(auth)/login          # logowanie
  /(auth)/register        # rejestracja
  /onboarding             # onboarding (4 kroki)
  /dashboard               # panel główny
  /chat, /chat/[id]         # lista rozmów + konkretna rozmowa
  /patterns                # wzorce w relacji
  /memory                  # zarządzanie pamięcią
  /profile, /profile/test  # profil relacji + retake testu
  /settings                # ustawienia prywatności, usuwanie konta
  /privacy, /terms          # dokumenty prawne
  /api/...                  # wszystkie endpointy backendowe
/components
  /layout                  # AppShell, AuthProvider, SignOutButton
  /onboarding               # OnboardingFlow, AttachmentTest
  /chat                      # ChatWindow, QuickActionGrid, CrisisBanner, NewChatButton
  /dashboard                 # AttachmentScoreBars, MemoryManager, PatternsView, SettingsPanel
/lib
  /ai                       # client.ts (Anthropic), systemPrompt.ts, memoryExtraction.ts,
                              patternAnalysis.ts, crisisDetection.ts
  auth.ts, db.ts, session.ts, attachmentQuestions.ts, quickActions.ts, utils.ts
/prisma
  schema.prisma, seed.ts
/types
  next-auth.d.ts
```

## Bezpieczeństwo

- Hasła hashowane bcryptem (10 rund), nigdy plaintext.
- Sesje JWT przez NextAuth; middleware chroni segmenty `/dashboard`, `/chat`,
  `/patterns`, `/memory`, `/profile`, `/settings`.
- Każdy endpoint API weryfikuje `userId` z sesji i filtruje zapytania do bazy po
  `userId` — jeden użytkownik nie ma dostępu do danych innego.
- Detekcja sygnałów kryzysowych (przemoc, groźby, stalking, myśli samobójcze) działa
  **niezależnie** od AI — jawna lista słów kluczowych w `lib/ai/crisisDetection.ts`
  wyzwala baner z numerami pomocy, niezależnie od treści odpowiedzi modelu.
- System prompt (`lib/ai/systemPrompt.ts`) jawnie zabrania AI stawiania diagnoz,
  demonizowania partnera i nakłaniania do pochopnych decyzji.
- Obsługa błędów: brak klucza API, rate limit, błąd sieci/bazy i wygasła sesja zwracają
  czytelne komunikaty zamiast crashować aplikację (patrz `app/api/messages/route.ts`,
  `app/error.tsx`).

## Status implementacji

**W pełni zaimplementowane i działające:**
konto (rejestracja/logowanie/wylogowanie, hashowanie haseł), baza danych (pełny schemat
Prisma), onboarding, test stylu przywiązania (30 pytań, realne liczenie wyniku), chat
z prawdziwym wywołaniem Anthropic API, historia rozmów, automatyczna ekstrakcja i
zarządzanie pamięcią (podgląd/edycja/usuwanie/wyczyszczenie), analiza wzorców na
żądanie, dashboard, profil relacji, ustawienia (w tym usunięcie konta), detekcja
sygnałów kryzysowych, responsywny UI, obsługa błędów.

**Świadome uproszczenia MVP (do rozbudowy w kolejnych iteracjach):**
- Ekstrakcja pamięci i analiza wzorców wykonują się synchronicznie w ramach żądania
  HTTP (brak kolejki/joba w tle) — w wersji produkcyjnej z dużym ruchem warto to
  przenieść do osobnego workera, żeby nie wydłużać czasu odpowiedzi czatu.
- Deduplikacja pamięci używa prostego podobieństwa tekstowego (Jaccard), nie
  embeddingów — przy dużej liczbie wpisów warto rozważyć wektorową bazę/embeddingi.
- „Mocne strony relacji” i „najczęstsze wyzwalacze” na stronie Profilu nie mają
  osobnej, zautomatyzowanej klasyfikacji sentymentu — profil pokazuje realne dane
  (partnerskie fakty, otwarte problemy, top wzorzec, obserwacje o relacji) bez
  udawania kategorii, których jeszcze nie liczymy.
- Brak resetu hasła e-mailem (konto oparte tylko o nick, świadomie bez e-maila) —
  do rozważenia: opcjonalne dodanie e-maila wyłącznie do odzyskiwania dostępu.
- Polityka prywatności i regulamin to szkice do przeglądu prawnego, nie finalne
  dokumenty.
