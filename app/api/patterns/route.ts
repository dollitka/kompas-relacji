import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { recomputePatternsForUser } from "@/lib/ai/patternAnalysis";
import { GeminiConfigError, GeminiRateLimitError, GeminiAPIError } from "@/lib/ai/client";

// Tak samo jak w /api/messages - analiza wzorców też wywołuje AI i może
// potrzebować więcej niż domyślne 10s.
export const maxDuration = 60;

export async function GET() {
  try {
    const user = await requireUser();
    const patterns = await prisma.pattern.findMany({ where: { userId: user.id }, orderBy: { lastSeenAt: "desc" } });
    return NextResponse.json({ patterns });
  } catch (err: any) {
    if (err?.status === 401) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
    return NextResponse.json({ error: "Błąd serwera." }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await requireUser();

    const result = await recomputePatternsForUser(user.id);

    if (result === null) {
      return NextResponse.json(
        { error: "Za mało materiału na analizę wzorców — opisz jeszcze kilka sytuacji i spróbuj ponownie." },
        { status: 400 }
      );
    }

    if (result.created === 0 && result.updated === 0) {
      return NextResponse.json({ patterns: [], message: "Nie znaleziono jeszcze wyraźnych powtarzających się wzorców." });
    }

    const patterns = await prisma.pattern.findMany({ where: { userId: user.id }, orderBy: { lastSeenAt: "desc" } });
    return NextResponse.json({ patterns });
  } catch (err: any) {
    if (err?.status === 401) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
    console.error("Pattern analysis error:", err);
    if (err instanceof GeminiConfigError) return NextResponse.json({ error: err.message }, { status: 503 });
    if (err instanceof GeminiRateLimitError) return NextResponse.json({ error: err.message }, { status: 429 });
    if (err instanceof GeminiAPIError) return NextResponse.json({ error: "Analiza wzorców jest chwilowo niedostępna." }, { status: 502 });
    return NextResponse.json({ error: "Nie udało się przeanalizować wzorców." }, { status: 500 });
  }
}
