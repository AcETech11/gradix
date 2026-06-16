export type DashboardStatTone = "positive" | "warning" | "neutral";
export type DashboardStatIconName = "UsersRound" | "BookOpenText" | "ShieldCheck" | "GraduationCap" | "FileUp";
export type DashboardTimelineIconName = "UsersRound" | "ShieldCheck" | "GraduationCap" | "FileUp";

export type DashboardStat = {
  label: string;
  value: string;
  change: string;
  description: string;
  tone: DashboardStatTone;
  icon: DashboardStatIconName;
};

export type TimelineItem = {
  title: string;
  description: string;
  time: string;
  icon: DashboardTimelineIconName;
};

export type SetupStep = {
  label: string;
  complete: boolean;
  href?: string;
};
