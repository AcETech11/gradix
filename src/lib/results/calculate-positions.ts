export type SubjectPositionInput = {
  studentId: string;
  subjectId: string;
  totalScore: number;
};

export type OverallPositionInput = {
  studentId: string;
  totalScore: number;
  averageScore: number;
};

function ordinalSuffix(position: number) {
  const mod100 = position % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";

  switch (position % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export function formatPosition(position: number | null | undefined) {
  return position ? `${position}${ordinalSuffix(position)}` : "-";
}

function rankedPositions<TItem>(items: TItem[], compare: (first: TItem, second: TItem) => number, isTie: (first: TItem, second: TItem) => boolean) {
  const sorted = [...items].sort(compare);
  const positions = new Map<TItem, number>();
  let lastItem: TItem | null = null;
  let lastPosition = 0;

  sorted.forEach((item, index) => {
    const position = lastItem && isTie(lastItem, item) ? lastPosition : index + 1;
    positions.set(item, position);
    lastItem = item;
    lastPosition = position;
  });

  return positions;
}

export function calculateSubjectPositions(rows: SubjectPositionInput[]) {
  const positions = new Map<string, number>();
  const bySubject = new Map<string, SubjectPositionInput[]>();

  rows.forEach((row) => {
    bySubject.set(row.subjectId, [...(bySubject.get(row.subjectId) ?? []), row]);
  });

  bySubject.forEach((subjectRows) => {
    const ranked = rankedPositions(
      subjectRows,
      (first, second) => second.totalScore - first.totalScore,
      (first, second) => first.totalScore === second.totalScore,
    );

    subjectRows.forEach((row) => {
      positions.set(`${row.studentId}:${row.subjectId}`, ranked.get(row) ?? 0);
    });
  });

  return positions;
}

export function calculateOverallPositions(rows: OverallPositionInput[]) {
  const ranked = rankedPositions(
    rows,
    (first, second) => second.averageScore - first.averageScore || second.totalScore - first.totalScore,
    (first, second) => first.averageScore === second.averageScore && first.totalScore === second.totalScore,
  );

  return new Map(rows.map((row) => [row.studentId, ranked.get(row) ?? 0]));
}
