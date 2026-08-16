import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// ---------------------------------------------------------------------------
// Dane demonstracyjne — służą WYŁĄCZNIE do testowania funkcji aplikacji
// (onboarding, profil, chat, pamięć, wzorce). Tworzą osobne konto "demo" z
// hasłem podanym niżej; nigdy nie są mieszane z prawdziwymi kontami
// użytkowników. Uruchom przez: npm run seed
// ---------------------------------------------------------------------------

const prisma = new PrismaClient();

const DEMO_NICK = "demo";
const DEMO_PASSWORD = "DemoHaslo123";

async function main() {
  const existing = await prisma.user.findUnique({ where: { nick: DEMO_NICK } });
  if (existing) {
    console.log(`Użytkownik demo już istnieje (nick: ${DEMO_NICK}). Usuwam i tworzę od nowa…`);
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const user = await prisma.user.create({
    data: {
      nick: DEMO_NICK,
      passwordHash,
      onboardingCompleted: true,
      settings: { create: {} },
      profile: {
        create: {
          displayName: "Kasia",
          userGender: "kobieta",
          partnerGender: "mężczyzna",
          relationshipType: "Związek heteroseksualny",
          relationshipStart: new Date("2022-03-01"),
          livingTogether: true,
          relationshipRating: 6,
          topProblems: "Mam wrażenie, że gonię go rozmową, a on się wycofuje, gdy robi się poważnie.",
          improvementGoals: "Chciałabym, żebyśmy potrafili rozmawiać o trudnych rzeczach bez eskalacji.",
        },
      },
      partner: { create: { name: "Marek", notes: "Unika długich rozmów o uczuciach, potrzebuje czasu po konflikcie." } },
      assessments: {
        create: { anxiousScore: 72, avoidantScore: 31, secureScore: 48, answers: [] },
      },
    },
  });

  const conversation = await prisma.conversation.create({
    data: {
      userId: user.id,
      title: "Pokłóciliśmy się o wieczór u jego rodziców",
      mode: "conflict",
      messages: {
        create: [
          {
            role: "user",
            content:
              "Pokłóciliśmy się, bo chciałam z nim porozmawiać o czymś ważnym, a on powiedział, że potrzebuje przestrzeni i wyszedł na spacer.",
          },
          {
            role: "assistant",
            content:
              "To brzmi na sytuację, w której Wasze potrzeby w tym momencie się rozminęły — Ty szukałaś bliskości i rozmowy, a on prawdopodobnie potrzebował chwili, żeby ochłonąć, zanim będzie gotowy na trudną rozmowę. To dość częsty schemat: jedna osoba zbliża się, gdy czuje napięcie, druga się oddala. Żadna z tych reakcji sama w sobie nie jest \"zła\" — ale gdy się ze sobą zderzają, łatwo o eskalację. Co czułaś, gdy wyszedł?",
          },
          { role: "user", content: "Czułam się odrzucona i jeszcze bardziej się zdenerwowałam, więc napisałam do niego kilka wiadomości." },
          {
            role: "assistant",
            content:
              "To zrozumiała reakcja — poczucie odrzucenia często aktywuje potrzebę natychmiastowego kontaktu, żeby zmniejszyć niepokój. Jednocześnie z jego perspektywy (to hipoteza, nie fakt) seria wiadomości w momencie, gdy prosił o przestrzeń, mogła zwiększyć presję, którą właśnie próbował zmniejszyć — co czasem prowadzi do jeszcze silniejszego wycofania. To może być właśnie ten cykl: Ty szukasz bliskości → on się wycofuje → Ty czujesz się odrzucona i zwiększasz kontakt → on wycofuje się jeszcze bardziej. Czy to coś, co rozpoznajesz z wcześniejszych sytuacji?",
          },
        ],
      },
    },
  });

  await prisma.memory.createMany({
    data: [
      {
        userId: user.id,
        category: "FACT",
        subject: "USER",
        content: "Gdy czuje dystans ze strony partnera, ma tendencję do wysyłania kilku wiadomości z rzędu.",
        confidence: 85,
        importance: 70,
        sourceConversationId: conversation.id,
      },
      {
        userId: user.id,
        category: "FACT",
        subject: "PARTNER",
        content: "Marek reaguje na konflikt potrzebą wyjścia/przestrzeni, zanim jest gotowy rozmawiać.",
        confidence: 80,
        importance: 75,
        sourceConversationId: conversation.id,
      },
      {
        userId: user.id,
        category: "INTERPRETATION",
        subject: "RELATIONSHIP",
        content: "Możliwy cykl pursue/withdraw: potrzeba bliskości użytkowniczki aktywuje wycofanie partnera, co nasila jej lęk.",
        confidence: 60,
        importance: 80,
        sourceConversationId: conversation.id,
      },
      {
        userId: user.id,
        category: "OPEN_ISSUE",
        subject: "RELATIONSHIP",
        content: "Brak wspólnie ustalonego sposobu na sygnalizowanie potrzeby przestrzeni bez poczucia odrzucenia drugiej strony.",
        confidence: 65,
        importance: 85,
        sourceConversationId: conversation.id,
      },
    ],
  });

  await prisma.pattern.create({
    data: {
      userId: user.id,
      title: "Cykl pursue/withdraw po konflikcie",
      description:
        "Gdy pojawia się napięcie, Kasia szuka bliskości i rozmowy, a Marek wycofuje się, potrzebując przestrzeni. Brak przestrzeni pogłębia u niej poczucie odrzucenia, co prowadzi do zwiększenia kontaktu i dalszego wycofania z jego strony.",
      category: "pursue_withdraw",
      cycleSteps: [
        "Kasia szuka rozmowy",
        "Marek prosi o przestrzeń i się wycofuje",
        "Kasia czuje odrzucenie i zwiększa kontakt",
        "Marek wycofuje się jeszcze bardziej",
      ],
      occurrences: 3,
    },
  });

  await prisma.importantEvent.create({
    data: {
      userId: user.id,
      title: "Pierwsza poważna rozmowa o wspólnym mieszkaniu",
      description: "Rozmowa zakończona ustaleniem, że spróbują zamieszkać razem od czerwca.",
      eventDate: new Date("2024-01-15"),
      valence: "positive",
    },
  });

  console.log("✅ Dane demo utworzone.");
  console.log(`   Nick: ${DEMO_NICK}`);
  console.log(`   Hasło: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
