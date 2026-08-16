import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const conversation = await prisma.conversation.findFirst({
      where: { id: params.id, userId: user.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!conversation) return NextResponse.json({ error: "Nie znaleziono rozmowy." }, { status: 404 });
    return NextResponse.json({ conversation });
  } catch (err: any) {
    if (err?.status === 401) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
    console.error("Get conversation error:", err);
    return NextResponse.json({ error: "Błąd serwera." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const conversation = await prisma.conversation.findFirst({ where: { id: params.id, userId: user.id } });
    if (!conversation) return NextResponse.json({ error: "Nie znaleziono rozmowy." }, { status: 404 });
    await prisma.conversation.delete({ where: { id: conversation.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.status === 401) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
    console.error("Delete conversation error:", err);
    return NextResponse.json({ error: "Nie udało się usunąć rozmowy." }, { status: 500 });
  }
}
