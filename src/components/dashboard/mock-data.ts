type DashboardStatTone = "positive" | "warning" | "neutral";
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
};

export const DASHBOARD_STATS: DashboardStat[] = [
  {
    label: "Total Students",
    value: "1,248",
    change: "+12.4%",
    description: "Compared with the previous term",
    tone: "positive",
    icon: "UsersRound",
  },
  {
    label: "Active Classes",
    value: "42",
    change: "+4.1%",
    description: "Across primary and secondary levels",
    tone: "neutral",
    icon: "BookOpenText",
  },
  {
    label: "Published Results",
    value: "96%",
    change: "+2.8%",
    description: "Ready for parent access checks",
    tone: "positive",
    icon: "ShieldCheck",
  },
  {
    label: "Parent Result Checks",
    value: "327",
    change: "+18%",
    description: "Verified from result code access",
    tone: "neutral",
    icon: "GraduationCap",
  },
  {
    label: "Pending Uploads",
    value: "8",
    change: "-2",
    description: "Waiting for validation and review",
    tone: "warning",
    icon: "FileUp",
  },
];

export const RECENT_ACTIVITY: TimelineItem[] = [
  {
    title: "Result uploaded",
    description: "JSS 1A Mathematics batch imported for validation.",
    time: "12 minutes ago",
    icon: "FileUp",
  },
  {
    title: "Result published",
    description: "Second-term SS 2 results were published for parent access.",
    time: "41 minutes ago",
    icon: "ShieldCheck",
  },
  {
    title: "Student added",
    description: "Amina Bello was created and linked to Primary 4.",
    time: "2 hours ago",
    icon: "UsersRound",
  },
  {
    title: "Parent checked result",
    description: "Result code GDX-7X9K was opened from a mobile device.",
    time: "Today, 8:14 AM",
    icon: "GraduationCap",
  },
];

export const SETUP_STEPS: SetupStep[] = [
  {
    label: "School Information",
    complete: true,
  },
  {
    label: "Logo Uploaded",
    complete: true,
  },
  {
    label: "Classes Added",
    complete: true,
  },
  {
    label: "Students Imported",
    complete: false,
  },
  {
    label: "First Result Uploaded",
    complete: false,
  },
];
