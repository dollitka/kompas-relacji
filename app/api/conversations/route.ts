import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await requireUser();
    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        mode: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });
    return NextResponse.json({ conversations });
  } catch (err: any) {
    if (err?.status === 401) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
    console.error("List conversations error:", err);
    return NextResponse.json({ error: "Błąd serwera." }, { status: 500 });
  }
}

const createSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  mode: z.string().trim().max(60).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Nieprawidłowe dane." }, { status: 400 });
    }

    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        title: parsed.data.title ?? "Nowa rozmowa",
        mode: parsed.data.mode ?? null,
      },
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (err: any) {
    if (err?.status === 401) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
    console.error("Create conversation error:", err);
    return NextResponse.json({ error: "Nie udało się utworzyć rozmowy." }, { status: 500 });
  }
}
