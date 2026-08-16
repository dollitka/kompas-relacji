import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

const onboardingSchema = z.object({
  displayName: z.string().trim().min(1).max(40),
  userGender: z.string().trim().max(40).optional().nullable(),
  partnerGender: z.string().trim().max(40).optional().nullable(),
  relationshipType: z.string().trim().min(1).max(60),
  partnerName: z.string().trim().max(40).optional().nullable(),
  relationshipStart: z.string().optional().nullable(),
  livingTogether: z.boolean().optional().nullable(),
  relationshipRating: z.number().int().min(1).max(10).optional().nullable(),
  topProblems: z.string().trim().max(1000).optional().nullable(),
  improvementGoals: z.string().trim().max(1000).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = onboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" }, { status: 400 });
    }

    const d = parsed.data;

    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        displayName: d.displayName,
        userGender: d.userGender || null,
        partnerGender: d.partnerGender || null,
        relationshipType: d.relationshipType,
        relationshipStart: d.relationshipStart ? new Date(d.relationshipStart) : null,
        livingTogether: d.livingTogether ?? null,
        relationshipRating: d.relationshipRating ?? null,
        topProblems: d.topProblems || null,
        improvementGoals: d.improvementGoals || null,
      },
      create: {
        userId: user.id,
        displayName: d.displayName,
        userGender: d.userGender || null,
        partnerGender: d.partnerGender || null,
        relationshipType: d.relationshipType,
        relationshipStart: d.relationshipStart ? new Date(d.relationshipStart) : null,
        livingTogether: d.livingTogether ?? null,
        relationshipRating: d.relationshipRating ?? null,
        topProblems: d.topProblems || null,
        improvementGoals: d.improvementGoals || null,
      },
    });

    if (d.partnerName) {
      await prisma.partner.upsert({
        where: { userId: user.id },
        update: { name: d.partnerName },
        create: { userId: user.id, name: d.partnerName },
      });
    }

    // UWAGA: onboardingCompleted NIE jest ustawiane tutaj — onboarding liczy się
    // za zakończony dopiero po kroku 4 (test stylu przywiązania), patrz
    // app/api/assessment/route.ts. Dzięki temu użytkownik, który przerwie
    // onboarding po zapisaniu profilu, ale przed testem, przy kolejnym logowaniu
    // wróci do onboardingu zamiast trafić na dashboard bez wyniku testu.

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.status === 401) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
    console.error("Onboarding save error:", err);
    return NextResponse.json({ error: "Nie udało się zapisać danych onboardingu." }, { status: 500 });
  }
}
