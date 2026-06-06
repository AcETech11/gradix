export function calculatePassRate(scores: number[]) {
  if (!scores.length) {
    return 0;
  }

  const passes = scores.filter((score) => score >= 40).length;

  return Math.round((passes / scores.length) * 100);
}

export function average(scores: number[]) {
  if (!scores.length) {
    return 0;
  }

  return Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10;
}
