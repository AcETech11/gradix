export const REPORT_FORMATS = ["standard", "comprehensive_primary"] as const;

export type ReportFormat = (typeof REPORT_FORMATS)[number];

export const AFFECTIVE_TRAITS = [
  "Punctuality",
  "Neatness",
  "Attitude to Work",
  "Relationship with Teachers",
] as const;

export const PSYCHOMOTOR_TRAITS = [
  "Handwriting",
  "Verbal Fluency",
  "Games / Hand Tools",
  "Music Skills",
] as const;

export type AffectiveTrait = (typeof AFFECTIVE_TRAITS)[number];
export type PsychomotorTrait = (typeof PSYCHOMOTOR_TRAITS)[number];
export type TraitRatingMap = Partial<Record<AffectiveTrait | PsychomotorTrait, number>>;

export const RATING_SCALE = [
  [5, "Excellent level of observable traits"],
  [4, "Good level of observable traits"],
  [3, "Fair but acceptable level of observable traits"],
  [2, "Needs improvement"],
  [1, "Poor level of observable traits"],
] as const;

export type ComprehensiveReportDetails = {
  attendancePresent: number | null;
  attendanceAbsent: number | null;
  affectiveDomain: TraitRatingMap;
  psychomotorDomain: TraitRatingMap;
};

export type ClassTermReportDetails = {
  schoolOpenDays: number | null;
  termEndsOn: string | null;
  nextTermBeginsOn: string | null;
};

const TRAIT_KEY_ALIASES = new Map<string, AffectiveTrait | PsychomotorTrait>(
  [...AFFECTIVE_TRAITS, ...PSYCHOMOTOR_TRAITS].flatMap((trait) => {
    const compact = trait.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

    return [
      [trait, trait],
      [trait.toLowerCase(), trait],
      [compact, trait],
      [compact.replace(/_/g, ""), trait],
    ];
  }),
);

export function isReportFormat(value: unknown): value is ReportFormat {
  return value === "standard" || value === "comprehensive_primary";
}

export function formatTraitHeader(trait: string) {
  return `${trait} (1-5)`;
}

export function sanitizeRatingMap(value: unknown): TraitRatingMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, rating]) => {
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
      const trait = TRAIT_KEY_ALIASES.get(key) ?? TRAIT_KEY_ALIASES.get(key.toLowerCase()) ?? TRAIT_KEY_ALIASES.get(normalizedKey) ?? TRAIT_KEY_ALIASES.get(normalizedKey.replace(/_/g, ""));

      if (!trait || typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
        return [];
      }

      return [[trait, rating]];
    }),
  ) as TraitRatingMap;
}
