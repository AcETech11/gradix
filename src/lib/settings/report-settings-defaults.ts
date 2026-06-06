export type ReportSettings = {
  reportTitle: string;
  showSchoolMotto: boolean;
  showStudentCode: boolean;
  showAdmissionNumber: boolean;
  showClassPosition: boolean;
  showGradingGuide: boolean;
  showPerformanceSummary: boolean;
  footerNote: string;
  principalComment: string;
  classTeacherComment: string;
  nextTermBegins: string;
};

export const DEFAULT_REPORT_SETTINGS: ReportSettings = {
  reportTitle: "OFFICIAL STUDENT RESULT REPORT",
  showSchoolMotto: true,
  showStudentCode: true,
  showAdmissionNumber: true,
  showClassPosition: false,
  showGradingGuide: true,
  showPerformanceSummary: true,
  footerNote: "This result was published by the school and verified through Gradix.",
  principalComment: "",
  classTeacherComment: "",
  nextTermBegins: "",
};
