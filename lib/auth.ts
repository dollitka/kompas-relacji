import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// Autoryzacja oparta o nick + hasło. Celowo NIE zbieramy prawdziwego imienia
// ani e-maila — użytkownik może pozostać anonimowy.
// Hasła są hashowane bcryptem (10 rund), nigdy nie przechowujemy plaintextu.
// ---------------------------------------------------------------------------

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        nick: { label: "Nick", type: "text" },
        password: { label: "Hasło", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.nick || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { nick: credentials.nick.trim().toLowerCase() },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.nick,
          onboardingCompleted: user.onboardingCompleted,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.onboardingCompleted = (user as any).onboardingCompleted;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).onboardingCompleted = token.onboardingCompleted;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
