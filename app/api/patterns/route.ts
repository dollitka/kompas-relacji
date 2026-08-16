import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { analyzePatterns } from "@/lib/ai/patternAnalysis";
import { AnthropicConfigError, AnthropicRateLimitError, AnthropicAPIError } from "@/lib/ai/client";

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

const MIN_MESSAGES_FOR_ANALYSIS = 4;

export async function POST() {
  try {
    const user = await requireUser();

    const [memories, messageCount] = await Promise.all([
      prisma.memory.findMany({
        where: { userId: user.id, archived: false, category: { in: ["FACT", "INTERPRETATION", "PATTERN"] } },
        orderBy: { createdAt: "desc" },
        take: 60,
      }),
      prisma.message.count({ where: { conversation: { userId: user.id }, role: "user" } }),
    ]);

    if (messageCount < MIN_MESSAGES_FOR_ANALYSIS || memories.length === 0) {
      return NextResponse.json(
        { error: "Za mało materiału na analizę wzorców — opisz jeszcze kilka sytuacji i spróbuj ponownie." },
        { status: 400 }
      );
    }

    const contextText = memories.map((m) => `- [${m.subject}/${m.category}] ${m.content}`).join("\n");
    const candidates = await analyzePatterns(contextText);

    if (candidates.length === 0) {
      return NextResponse.json({ patterns: [], message: "Nie znaleziono jeszcze wyraźnych powtarzających się wzorców." });
    }

    const existing = await prisma.pattern.findMany({ where: { userId: user.id } });

    for (const candidate of candidates) {
      const match = existing.find((p) => similarity(normalize(p.title), normalize(candidate.title)) > 0.5);
      if (match) {
        await prisma.pattern.update({
          where: { id: match.id },
          data: {
            occurrences: { increment: 1 },
            lastSeenAt: new Date(),
            description: candidate.description,
            cycleSteps: candidate.cycleSteps.length > 0 ? candidate.cycleSteps : (match.cycleSteps as any),
          },
        });
      } else {
        await prisma.pattern.create({
          data: {
            userId: user.id,
            title: candidate.title,
            description: candidate.description,
            category: candidate.category,
            cycleSteps: candidate.cycleSteps,
          },
        });
      }
    }

    const patterns = await prisma.pattern.findMany({ where: { userId: user.id }, orderBy: { lastSeenAt: "desc" } });
    return NextResponse.json({ patterns });
  } catch (err: any) {
    if (err?.status === 401) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
    console.error("Pattern analysis error:", err);
    if (err instanceof AnthropicConfigError) return NextResponse.json({ error: err.message }, { status: 503 });
    if (err instanceof AnthropicRateLimitError) return NextResponse.json({ error: err.message }, { status: 429 });
    if (err instanceof AnthropicAPIError) return NextResponse.json({ error: "Analiza wzorców jest chwilowo niedostępna." }, { status: 502 });
    return NextResponse.json({ error: "Nie udało się przeanalizować wzorców." }, { status: 500 });
  }
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function similarity(a: string, b: string): number {
  const setA = new Set(a.split(" "));
  const setB = new Set(b.split(" "));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}
