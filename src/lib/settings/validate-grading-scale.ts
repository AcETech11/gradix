import type { GradingBand } from "@/lib/settings/default-grading-scale";

export function validateGradingScaleBands(bands: GradingBand[]) {
  if (!bands.length) {
    return "Add at least one grading band.";
  }

  for (const band of bands) {
    if (band.min < 0 || band.max > 100 || band.min > band.max) {
      return "Every grading band must stay between 0 and 100, with minimum lower than maximum.";
    }
  }

  const sorted = [...bands].sort((first, second) => first.min - second.min);

  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index].min <= sorted[index - 1].max) {
      return "Grading bands cannot overlap.";
    }
  }

  if (sorted[0].min > 0 || sorted.at(-1)?.max !== 100) {
    return "Try to cover the full 0-100 score range.";
  }

  return null;
}
