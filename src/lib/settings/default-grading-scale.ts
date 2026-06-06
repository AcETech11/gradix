export type GradingBand = {
  min: number;
  max: number;
  grade: string;
  remark: string;
};

export const DEFAULT_GRADING_SCALE: GradingBand[] = [
  { min: 70, max: 100, grade: "A", remark: "Excellent" },
  { min: 60, max: 69, grade: "B", remark: "Good" },
  { min: 50, max: 59, grade: "C", remark: "Credit" },
  { min: 40, max: 49, grade: "D", remark: "Pass" },
  { min: 0, max: 39, grade: "F", remark: "Needs Improvement" },
];
