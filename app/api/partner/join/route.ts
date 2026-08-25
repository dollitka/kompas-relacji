import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { redeemInvite } from "@/lib/partnerLink";

const schema = z.object({ code: z.string().trim().min(4).max(20) });

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Wpisz poprawny kod zaproszenia." }, { status: 400 });
    }

    await redeemInvite(user.id, parsed.data.code);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.status === 401) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
    if (err?.message === "ALREADY_LINKED") {
      return NextResponse.json({ error: "Masz już aktywne połączenie z partnerem/ką." }, { status: 409 });
    }
    if (err?.message === "INVALID_CODE") {
      return NextResponse.json({ error: "Ten kod jest nieprawidłowy albo już wykorzystany." }, { status: 404 });
    }
    if (err?.message === "CANNOT_LINK_SELF") {
      return NextResponse.json({ error: "Nie możesz połączyć konta samego/samej ze sobą." }, { status: 400 });
    }
    console.error("Redeem invite error:", err);
    return NextResponse.json({ error: "Nie udało się połączyć kont." }, { status: 500 });
  }
}
