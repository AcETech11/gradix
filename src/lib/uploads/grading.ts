export type GradeResult = {
  grade: string;
  label: string;
};

export function calculateGrade(total: number): GradeResult {
  if (total >= 70) {
    return { grade: "A", label: "Excellent" };
  }

  if (total >= 60) {
    return { grade: "B", label: "Good" };
  }

  if (total >= 50) {
    return { grade: "C", label: "Credit" };
  }

  if (total >= 40) {
    return { grade: "D", label: "Pass" };
  }

  return { grade: "F", label: "Fail" };
}
