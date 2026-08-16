import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

const updateSchema = z.object({
  content: z.string().trim().min(1).max(500),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Treść jest nieprawidłowa." }, { status: 400 });

    const memory = await prisma.memory.findFirst({ where: { id: params.id, userId: user.id } });
    if (!memory) return NextResponse.json({ error: "Nie znaleziono wpisu." }, { status: 404 });

    const updated = await prisma.memory.update({
      where: { id: memory.id },
      data: { content: parsed.data.content, userConfirmed: true },
    });

    return NextResponse.json({ memory: updated });
  } catch (err: any) {
    if (err?.status === 401) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
    console.error("Update memory error:", err);
    return NextResponse.json({ error: "Nie udało się zapisać zmiany." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const memory = await prisma.memory.findFirst({ where: { id: params.id, userId: user.id } });
    if (!memory) return NextResponse.json({ error: "Nie znaleziono wpisu." }, { status: 404 });
    await prisma.memory.delete({ where: { id: memory.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.status === 401) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
    console.error("Delete memory error:", err);
    return NextResponse.json({ error: "Nie udało się usunąć wpisu." }, { status: 500 });
  }
}
