import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { scoreAssessment } from "@/lib/attachmentQuestions";

const answerSchema = z.object({
  questionId: z.string(),
  value: z.number().int().min(1).max(5).nullable(),
});

const submitSchema = z.object({
  answers: z.array(answerSchema).min(1),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Nieprawidłowe dane testu." }, { status: 400 });
    }

    const scores = scoreAssessment(parsed.data.answers);

    const assessment = await prisma.attachmentAssessment.create({
      data: {
        userId: user.id,
        anxiousScore: scores.anxiousScore,
        avoidantScore: scores.avoidantScore,
        secureScore: scores.secureScore,
        answers: parsed.data.answers as any,
      },
    });

    // Test stylu przywiązania to krok 4 (ostatni) onboardingu — jego ukończenie
    // oznacza zakończenie całego onboardingu. Bezpieczne do wywołania wielokrotnie
    // (np. przy retake testu z /profile/test), bo onboarding i tak jest już wtedy
    // ukończony.
    await prisma.user.update({ where: { id: user.id }, data: { onboardingCompleted: true } });

    return NextResponse.json({ ok: true, assessment });
  } catch (err: any) {
    if (err?.status === 401) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
    console.error("Assessment save error:", err);
    return NextResponse.json({ error: "Nie udało się zapisać wyniku testu." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const latest = await prisma.attachmentAssessment.findFirst({
      where: { userId: user.id },
      orderBy: { completedAt: "desc" },
    });
    return NextResponse.json({ assessment: latest });
  } catch (err: any) {
    if (err?.status === 401) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
    return NextResponse.json({ error: "Błąd serwera." }, { status: 500 });
  }
}
