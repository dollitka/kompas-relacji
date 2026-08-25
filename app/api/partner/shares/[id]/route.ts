import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

const schema = z.object({ decision: z.enum(["approve", "decline", "revoke"]) });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Nieprawidłowa decyzja." }, { status: 400 });

    const memory = await prisma.memory.findFirst({ where: { id: params.id, userId: user.id } });
    if (!memory) return NextResponse.json({ error: "Nie znaleziono wpisu." }, { status: 404 });

    if (parsed.data.decision === "revoke") {
      if (memory.shareStatus !== "APPROVED") {
        return NextResponse.json({ error: "Ten wpis nie jest obecnie udostępniony." }, { status: 409 });
      }
      const updated = await prisma.memory.update({ where: { id: memory.id }, data: { shareStatus: "DECLINED" } });
      return NextResponse.json({ memory: updated });
    }

    if (memory.shareStatus !== "PENDING") {
      return NextResponse.json({ error: "Ten wpis nie czeka już na decyzję." }, { status: 409 });
    }

    const updated = await prisma.memory.update({
      where: { id: memory.id },
      data: { shareStatus: parsed.data.decision === "approve" ? "APPROVED" : "DECLINED" },
    });

    return NextResponse.json({ memory: updated });
  } catch (err: any) {
    if (err?.status === 401) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
    console.error("Share decision error:", err);
    return NextResponse.json({ error: "Nie udało się zapisać decyzji." }, { status: 500 });
  }
}
