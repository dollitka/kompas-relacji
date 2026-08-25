import { prisma } from "@/lib/db";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Logika łączenia kont partnerów. Zasada nadrzędna: aktywne połączenie
// (status "ACTIVE") jest JEDYNYM warunkiem, czy cokolwiek jest w danym
// momencie udostępniane między kontami - rozłączenie natychmiast to zatrzymuje,
// bez potrzeby czyszczenia wcześniej zatwierdzonych wpisów pamięci.
// ---------------------------------------------------------------------------

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // bez znaków łatwych do pomylenia (0/O, 1/I/L)
const CODE_LENGTH = 8;

function generateInviteCode(): string {
  let code = "";
  const bytes = crypto.randomBytes(CODE_LENGTH);
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

/** Zwraca aktywne połączenie użytkownika (jako A lub B) albo null. */
export async function getActiveCoupleLink(userId: string) {
  return prisma.coupleLink.findFirst({
    where: {
      status: "ACTIVE",
      OR: [{ userAId: userId }, { userBId: userId }],
    },
  });
}

/** Zwraca id drugiej osoby w aktywnym połączeniu, albo null jeśli brak połączenia. */
export async function getActivePartnerId(userId: string): Promise<string | null> {
  const link = await getActiveCoupleLink(userId);
  if (!link) return null;
  return link.userAId === userId ? link.userBId : link.userAId;
}

/**
 * Tworzy nowy kod zaproszenia dla użytkownika. Jeśli użytkownik ma już
 * niewykorzystany kod PENDING, zwraca ten sam (nie mnoży kodów bez potrzeby).
 * Odmawia, jeśli użytkownik ma już aktywne połączenie (trzeba je najpierw
 * rozłączyć).
 */
export async function createOrReuseInvite(userId: string) {
  const active = await getActiveCoupleLink(userId);
  if (active) {
    throw new Error("ALREADY_LINKED");
  }

  const existingPending = await prisma.coupleLink.findFirst({
    where: { userAId: userId, status: "PENDING" },
  });
  if (existingPending) return existingPending;

  // Generowanie unikalnego kodu - w praktyce kolizja jest astronomicznie mało
  // prawdopodobna, ale pętla zabezpiecza na wszelki wypadek.
  for (let attempt = 0; attempt < 5; attempt++) {
    const inviteCode = generateInviteCode();
    const clash = await prisma.coupleLink.findUnique({ where: { inviteCode } });
    if (!clash) {
      return prisma.coupleLink.create({
        data: { userAId: userId, inviteCode, status: "PENDING" },
      });
    }
  }
  throw new Error("CODE_GENERATION_FAILED");
}

export async function redeemInvite(userId: string, rawCode: string) {
  const code = rawCode.trim().toUpperCase();

  const alreadyActive = await getActiveCoupleLink(userId);
  if (alreadyActive) throw new Error("ALREADY_LINKED");

  const link = await prisma.coupleLink.findUnique({ where: { inviteCode: code } });
  if (!link || link.status !== "PENDING") throw new Error("INVALID_CODE");
  if (link.userAId === userId) throw new Error("CANNOT_LINK_SELF");

  return prisma.coupleLink.update({
    where: { id: link.id },
    data: { userBId: userId, status: "ACTIVE", linkedAt: new Date() },
  });
}

export async function unlinkCouple(userId: string) {
  const link = await getActiveCoupleLink(userId);
  if (!link) return null;
  return prisma.coupleLink.update({
    where: { id: link.id },
    data: { status: "UNLINKED", unlinkedAt: new Date() },
  });
}
