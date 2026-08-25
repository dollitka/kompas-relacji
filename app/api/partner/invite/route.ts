import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { createOrReuseInvite } from "@/lib/partnerLink";

export async function POST() {
  try {
    const user = await requireUser();
    const link = await createOrReuseInvite(user.id);
    return NextResponse.json({ inviteCode: link.inviteCode });
  } catch (err: any) {
    if (err?.status === 401) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
    if (err?.message === "ALREADY_LINKED") {
      return NextResponse.json({ error: "Masz już aktywne połączenie z partnerem/ką. Rozłącz je najpierw." }, { status: 409 });
    }
    console.error("Create invite error:", err);
    return NextResponse.json({ error: "Nie udało się wygenerować kodu." }, { status: 500 });
  }
}
