import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { unlinkCouple } from "@/lib/partnerLink";

export async function POST() {
  try {
    const user = await requireUser();
    await unlinkCouple(user.id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.status === 401) return NextResponse.json({ error: "Musisz się zalogować." }, { status: 401 });
    console.error("Unlink error:", err);
    return NextResponse.json({ error: "Nie udało się rozłączyć kont." }, { status: 500 });
  }
}
