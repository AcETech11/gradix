export type ReportSettings = {
  reportFormat: "standard" | "comprehensive_primary";
  reportTitle: string;
  showSchoolMotto: boolean;
  showStudentCode: boolean;
  showAdmissionNumber: boolean;
  showClassPosition: boolean;
  showGradingGuide: boolean;
  showPerformanceSummary: boolean;
  showAttendanceRecord: boolean;
  showAffectiveDomain: boolean;
  showPsychomotorDomain: boolean;
  showRatingScale: boolean;
  attendanceOpenDaysLabel: string;
  footerNote: string;
  principalComment: string;
  classTeacherComment: string;
  nextTermBegins: string;
};

export const DEFAULT_REPORT_SETTINGS: ReportSettings = {
  reportFormat: "standard",
  reportTitle: "OFFICIAL STUDENT RESULT REPORT",
  showSchoolMotto: true,
  showStudentCode: true,
  showAdmissionNumber: true,
  showClassPosition: false,
  showGradingGuide: true,
  showPerformanceSummary: true,
  showAttendanceRecord: true,
  showAffectiveDomain: true,
  showPsychomotorDomain: true,
  showRatingScale: true,
  attendanceOpenDaysLabel: "No. of Days School Opened",
  footerNote: "This result was published by the school and verified through Gradix.",
  principalComment: "",
  classTeacherComment: "",
  nextTermBegins: "",
};
