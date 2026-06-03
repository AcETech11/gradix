import type { AuthProfile, AuthSchool } from "@/types/auth";

export type OnboardingTeacher = {
  id: string;
  fullName: string;
};

export type OnboardingClass = {
  id: string;
  name: string;
  teacherId: string | null;
};

export type OnboardingSubject = {
  id: string;
  name: string;
  code: string;
  classIds: string[];
};

export type OnboardingInitialData = {
  profile: AuthProfile;
  school: AuthSchool;
  teachers: OnboardingTeacher[];
  classes: OnboardingClass[];
  subjects: OnboardingSubject[];
};

export type OnboardingActionState<TData = unknown> = {
  ok: boolean;
  message: string;
  data?: TData;
  fieldErrors?: Record<string, string[] | undefined>;
};
