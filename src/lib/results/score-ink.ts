export const SCORE_INK_COLORS = {
  red: "#B91C1C",
  black: "#111827",
  green: "#15803D",
} as const;

export type ScoreInkTone = keyof typeof SCORE_INK_COLORS;

export function getScoreInkTone(score: number | null | undefined): ScoreInkTone {
  if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 100) {
    return "black";
  }

  if (score < 40) return "red";
  if (score < 70) return "black";

  return "green";
}

export function getScoreInkClassName(score: number | null | undefined) {
  return `score-ink-${getScoreInkTone(score)}`;
}
