export const REPORT_SCORE_COLOURS = {
  red: "#B91C1C",
  black: "#111827",
  green: "#15803D",
} as const;

export type ReportScoreColourTone = keyof typeof REPORT_SCORE_COLOURS;

const REPORT_SCORE_CLASS_NAMES: Record<ReportScoreColourTone, string> = {
  red: "score-ink-red",
  black: "score-ink-black",
  green: "score-ink-green",
};

export function getReportScoreColourTone(score: number | null | undefined): ReportScoreColourTone {
  if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 100) {
    return "black";
  }

  if (score < 40) return "red";
  if (score < 70) return "black";

  return "green";
}

export function getReportScoreColourClassName(score: number | null | undefined) {
  return REPORT_SCORE_CLASS_NAMES[getReportScoreColourTone(score)];
}

export function getReportScoreColourStyle(score: number | null | undefined) {
  return { color: REPORT_SCORE_COLOURS[getReportScoreColourTone(score)] };
}
