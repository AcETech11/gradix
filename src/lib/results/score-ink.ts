import {
  getReportScoreColourClassName,
  getReportScoreColourStyle,
  getReportScoreColourTone,
  REPORT_SCORE_COLOURS,
  type ReportScoreColourTone,
} from "@/lib/report-score-colour";

export const SCORE_INK_COLORS = REPORT_SCORE_COLOURS;

export type ScoreInkTone = ReportScoreColourTone;

export const getScoreInkTone = getReportScoreColourTone;

export function getScoreInkClassName(score: number | null | undefined) {
  return getReportScoreColourClassName(score);
}

export const getScoreInkStyle = getReportScoreColourStyle;
