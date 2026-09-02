export type ScoreBand = "high" | "mid" | "low";

export function scoreBand(score: number): ScoreBand {
  if (score >= 75) return "high";
  if (score >= 50) return "mid";
  return "low";
}

export const scoreTextClass: Record<ScoreBand, string> = {
  high: "text-score-high",
  mid: "text-score-mid",
  low: "text-score-low",
};

export const scoreChipClass: Record<ScoreBand, string> = {
  high: "bg-score-high-soft text-score-high",
  mid: "bg-score-mid-soft text-score-mid",
  low: "bg-score-low-soft text-score-low",
};

export const scoreStrokeVar: Record<ScoreBand, string> = {
  high: "var(--score-high)",
  mid: "var(--score-mid)",
  low: "var(--score-low)",
};
