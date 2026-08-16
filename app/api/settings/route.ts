import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await requireUser();
    const settings = await prisma.settings.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
    return NextResponse.json({ settings });
  } catch (err: any) {
    if (err?.status === 401) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
    return NextResponse.json({ error: "Błąd serwera." }, { status: 500 });
  }
}

const updateSchema = z.object({
  memoryEnabled: z.boolean().optional(),
  aiAnalysisConsent: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Nieprawidłowe dane." }, { status: 400 });

    const settings = await prisma.settings.upsert({
      where: { userId: user.id },
      update: parsed.data,
      create: { userId: user.id, ...parsed.data },
    });

    return NextResponse.json({ settings });
  } catch (err: any) {
    if (err?.status === 401) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
    console.error("Update settings error:", err);
    return NextResponse.json({ error: "Nie udało się zapisać ustawień." }, { status: 500 });
  }
}
