import { CRISIS_RESOURCES_SELF_HARM, CRISIS_RESOURCES_VIOLENCE } from "@/lib/ai/crisisDetection";

export function CrisisBanner({ type }: { type: "violence" | "self_harm" }) {
  const text = type === "self_harm" ? CRISIS_RESOURCES_SELF_HARM : CRISIS_RESOURCES_VIOLENCE;
  return (
    <div role="alert" className="rounded-xl2 border border-anxious/30 bg-anxious/5 p-5">
      <p className="mb-2 text-sm font-semibold text-anxious">Ważna informacja o Twoim bezpieczeństwie</p>
      <p className="whitespace-pre-line text-sm leading-relaxed text-navy-700">{text}</p>
    </div>
  );
}
