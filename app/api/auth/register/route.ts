import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const registerSchema = z.object({
  nick: z
    .string()
    .trim()
    .min(3, "Nick musi mieć co najmniej 3 znaki")
    .max(24, "Nick może mieć maksymalnie 24 znaki")
    .regex(/^[a-zA-Z0-9_\-.]+$/, "Nick może zawierać tylko litery, cyfry, _ - ."),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const nick = parsed.data.nick.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { nick } });
    if (existing) {
      return NextResponse.json(
        { error: "Ten nick jest już zajęty. Wybierz inny." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    const user = await prisma.user.create({
      data: {
        nick,
        passwordHash,
        settings: { create: {} },
      },
      select: { id: true, nick: true },
    });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Coś poszło nie tak. Spróbuj ponownie." },
      { status: 500 }
    );
  }
}
