export const DEFAULT_CLASS_PROGRESSION = [
  ["Nursery 1", "Nursery 2"],
  ["Nursery 2", "Nursery 3"],
  ["Primary 1", "Primary 2"],
  ["Primary 2", "Primary 3"],
  ["Primary 3", "Primary 4"],
  ["Primary 4", "Primary 5"],
  ["Primary 5", "Primary 6"],
  ["JSS 1", "JSS 2"],
  ["JSS 2", "JSS 3"],
  ["JSS 3", "SSS 1"],
  ["SSS 1", "SSS 2"],
  ["SSS 2", "SSS 3"],
  ["SSS 3", "Graduated"],
] as const;

export function suggestNextClassName(className: string) {
  const normalized = className.trim().toLowerCase();
  const match = DEFAULT_CLASS_PROGRESSION.find(([from]) => from.toLowerCase() === normalized);

  return match?.[1] ?? "";
}
