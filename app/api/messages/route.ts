import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { checkCrisisSignals } from "@/lib/ai/crisisDetection";
import { buildSystemPrompt } from "@/lib/ai/systemPrompt";
import { getAssistantReply, GeminiConfigError, GeminiRateLimitError, GeminiAPIError, type ChatMessage } from "@/lib/ai/client";
import { extractAndStoreMemories } from "@/lib/ai/memoryExtraction";

const HISTORY_LIMIT = 20; // ostatnie N wiadomości przekazywane jako kontekst do AI

const bodySchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().trim().min(1).max(6000),
});

export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Wiadomość jest nieprawidłowa lub zbyt długa." }, { status: 400 });
  }
  const { conversationId, content } = parsed.data;

  const conversation = await prisma.conversation.findFirst({ where: { id: conversationId, userId: user.id } });
  if (!conversation) {
    return NextResponse.json({ error: "Nie znaleziono rozmowy." }, { status: 404 });
  }

  const crisis = checkCrisisSignals(content);

  // Zapisz wiadomość użytkownika od razu, niezależnie od tego, czy AI odpowie poprawnie.
  await prisma.message.create({
    data: { conversationId, role: "user", content, flaggedCrisis: crisis.isCrisis },
  });

  // Jeśli to pierwsza wiadomość w rozmowie, nadaj tytuł na podstawie jej treści.
  if (conversation.title === "Nowa rozmowa") {
    const title = content.length > 60 ? content.slice(0, 57) + "…" : content;
    await prisma.conversation.update({ where: { id: conversationId }, data: { title } });
  }

  try {
    const [profile, partner, assessment, memories, patterns, history] = await Promise.all([
      prisma.profile.findUnique({ where: { userId: user.id } }),
      prisma.partner.findUnique({ where: { userId: user.id } }),
      prisma.attachmentAssessment.findFirst({ where: { userId: user.id }, orderBy: { completedAt: "desc" } }),
      prisma.memory.findMany({
        where: { userId: user.id, archived: false },
        orderBy: [{ importance: "desc" }, { createdAt: "desc" }],
        take: 40,
      }),
      prisma.pattern.findMany({ where: { userId: user.id }, orderBy: { lastSeenAt: "desc" }, take: 10 }),
      prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        take: HISTORY_LIMIT,
      }),
    ]);

    const system = buildSystemPrompt({ profile, partner, assessment, memories, patterns, mode: conversation.mode });

    const chatHistory: ChatMessage[] = history
      .reverse()
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const replyText = await getAssistantReply(system, chatHistory);

    const assistantMessage = await prisma.message.create({
      data: { conversationId, role: "assistant", content: replyText },
    });

    await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

    // Ekstrakcja pamięci — wykonywana synchronicznie (środowisko serverless nie
    // gwarantuje pracy w tle po zwróceniu odpowiedzi). W wersji produkcyjnej
    // warto przenieść to do kolejki/joba, żeby nie wydłużać czasu odpowiedzi.
    extractAndStoreMemories({
      userId: user.id,
      conversationId,
      userMessage: content,
      assistantMessage: replyText,
    }).catch((e) => console.error("Background memory extraction error:", e));

    return NextResponse.json({
      message: assistantMessage,
      crisis: crisis.isCrisis ? crisis.type : null,
    });
  } catch (err) {
    console.error("Chat error:", err);
    if (err instanceof GeminiConfigError) {
      return NextResponse.json({ error: "Asystent AI nie jest skonfigurowany (brak klucza API). Skontaktuj się z administratorem aplikacji." }, { status: 503 });
    }
    if (err instanceof GeminiRateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    if (err instanceof GeminiAPIError) {
      return NextResponse.json({ error: "Asystent AI jest chwilowo niedostępny. Spróbuj ponownie za moment." }, { status: 502 });
    }
    return NextResponse.json({ error: "Coś poszło nie tak. Spróbuj ponownie." }, { status: 500 });
  }
}
