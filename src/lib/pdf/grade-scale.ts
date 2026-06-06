export function reportGradeFromScore(total: number) {
  if (total >= 70) return "A";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  if (total >= 40) return "D";
  return "F";
}

export function reportGradeMeaning(grade: string) {
  const meanings: Record<string, string> = {
    A: "Excellent",
    B: "Good",
    C: "Credit",
    D: "Pass",
    F: "Fail",
  };

  return meanings[grade] ?? "Ungraded";
}
