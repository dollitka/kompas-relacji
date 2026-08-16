import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Zwraca zalogowanego użytkownika (id + nick + świeży status onboardingu) albo null.
 * Status onboardingu jest dociągany bezpośrednio z bazy (nie z JWT), bo token
 * sesji nie odświeża się automatycznie po zakończeniu onboardingu w tej samej sesji.
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const id = (session.user as any).id as string;
  const fresh = await prisma.user.findUnique({
    where: { id },
    select: { id: true, nick: true, onboardingCompleted: true },
  });
  if (!fresh) return null;

  return {
    id: fresh.id,
    nick: fresh.nick,
    onboardingCompleted: fresh.onboardingCompleted,
  };
}

/** Jak getCurrentUser, ale rzuca 401-kompatybilny błąd gdy brak sesji — do API routes. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    const err = new Error("UNAUTHORIZED");
    (err as any).status = 401;
    throw err;
  }
  return user;
}
