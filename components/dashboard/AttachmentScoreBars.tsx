import { describeScores, type AttachmentScores } from "@/lib/attachmentQuestions";

const ROWS: { key: keyof AttachmentScores; label: string; colorClass: string }[] = [
  { key: "secureScore", label: "Cechy bezpieczne", colorClass: "bg-secure" },
  { key: "anxiousScore", label: "Cechy lękowe", colorClass: "bg-anxious" },
  { key: "avoidantScore", label: "Cechy unikające", colorClass: "bg-avoidant" },
];

export function AttachmentScoreBars({ scores, showDescription = true }: { scores: AttachmentScores; showDescription?: boolean }) {
  return (
    <div>
      <div className="space-y-4">
        {ROWS.map((row) => (
          <div key={row.key}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium text-navy-700">{row.label}</span>
              <span className="font-mono text-navy-500">{scores[row.key]}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-navy-50">
              <div className={`h-full rounded-full ${row.colorClass} transition-all`} style={{ width: `${scores[row.key]}%` }} />
            </div>
          </div>
        ))}
      </div>
      {showDescription && <p className="mt-4 text-sm leading-relaxed text-navy-500">{describeScores(scores)}</p>}
    </div>
  );
}
