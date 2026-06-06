export type PerformanceBand = {
  grade: "A" | "B" | "C" | "D" | "F";
  label: "Excellent" | "Good" | "Credit" | "Pass" | "Needs Improvement";
  remark: string;
  className: string;
  printClassName: string;
};

export function getPerformanceBand(score: number): PerformanceBand {
  if (score >= 70) {
    return {
      grade: "A",
      label: "Excellent",
      remark: "Excellent performance. Keep it up.",
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
      printClassName: "performance-excellent",
    };
  }

  if (score >= 60) {
    return {
      grade: "B",
      label: "Good",
      remark: "Good performance. More consistency will improve results.",
      className: "border-green-500/30 bg-green-500/10 text-green-700",
      printClassName: "performance-good",
    };
  }

  if (score >= 50) {
    return {
      grade: "C",
      label: "Credit",
      remark: "Fair performance. More effort is needed.",
      className: "border-sky-500/30 bg-sky-500/10 text-sky-700",
      printClassName: "performance-credit",
    };
  }

  if (score >= 40) {
    return {
      grade: "D",
      label: "Pass",
      remark: "Pass performance. Needs close academic support.",
      className: "border-amber-500/30 bg-amber-500/10 text-amber-700",
      printClassName: "performance-pass",
    };
  }

  return {
    grade: "F",
    label: "Needs Improvement",
    remark: "Weak performance. Focused academic support is recommended.",
    className: "border-red-500/30 bg-red-500/10 text-red-700",
    printClassName: "performance-fail",
  };
}
