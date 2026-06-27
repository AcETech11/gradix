export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole = "admin" | "headmaster" | "teacher" | "parent";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "paused" | "canceled";
export type SchoolTerm = "first" | "second" | "third";
export type UploadStatus = "draft" | "validating" | "validated" | "failed" | "published" | "archived";
export type AuditAction =
  | "insert"
  | "update"
  | "delete"
  | "publish"
  | "unpublish"
  | "validate"
  | "result_upload_replaced"
  | "payment_submission_created";
export type StudentStatus = "active" | "inactive" | "repeated" | "graduated" | "transferred" | "withdrawn" | "archived";
export type StudentEnrollmentStatus = "active" | "promoted" | "repeated" | "graduated" | "transferred" | "withdrawn" | "archived";

export type Database = {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string;
          name: string;
          slug: string;
          school_code: string;
          motto: string | null;
          logo_url: string | null;
          seal_url: string | null;
          headmaster_signature_url: string | null;
          registrar_signature_url: string | null;
          email: string | null;
          phone: string | null;
          website: string | null;
          address_line_1: string | null;
          address_line_2: string | null;
          city: string | null;
          state: string | null;
          country: string;
          subscription_status: SubscriptionStatus;
          subscription_plan: string;
          subscription_started_at: string | null;
          subscription_ends_at: string | null;
          subscription_expires_at: string | null;
          student_limit: number | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["schools"]["Row"]> &
          Pick<Database["public"]["Tables"]["schools"]["Row"], "name" | "slug" | "school_code">;
        Update: Partial<Database["public"]["Tables"]["schools"]["Row"]>;
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          school_id: string;
          role: AppRole;
          full_name: string;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          is_active: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> &
          Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "school_id" | "full_name">;
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
        Relationships: [];
      };
      demo_requests: {
        Row: {
          id: string;
          full_name: string;
          school_name: string;
          role: string | null;
          phone: string;
          email: string | null;
          student_count: number | null;
          student_count_range: string | null;
          preferred_plan: string | null;
          message: string | null;
          status: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["demo_requests"]["Row"]> &
          Pick<Database["public"]["Tables"]["demo_requests"]["Row"], "full_name" | "school_name" | "phone">;
        Update: Partial<Database["public"]["Tables"]["demo_requests"]["Row"]>;
        Relationships: [];
      };
      staff_invitations: {
        Row: {
          id: string;
          school_id: string;
          email: string;
          full_name: string | null;
          role: "admin" | "headmaster" | "teacher";
          token: string;
          status: "pending" | "accepted" | "expired" | "revoked";
          invited_by: string | null;
          expires_at: string | null;
          accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["staff_invitations"]["Row"]> &
          Pick<Database["public"]["Tables"]["staff_invitations"]["Row"], "school_id" | "email" | "role" | "token">;
        Update: Partial<Database["public"]["Tables"]["staff_invitations"]["Row"]>;
        Relationships: [];
      };
      school_staff: {
        Row: {
          id: string;
          school_id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          role: "admin" | "headmaster" | "teacher";
          is_active: boolean;
          signature_url: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["school_staff"]["Row"]> &
          Pick<Database["public"]["Tables"]["school_staff"]["Row"], "school_id" | "full_name">;
        Update: Partial<Database["public"]["Tables"]["school_staff"]["Row"]>;
        Relationships: [];
      };
      student_term_reports: {
        Row: {
          id: string;
          school_id: string;
          student_id: string;
          class_id: string;
          academic_year: string;
          term: SchoolTerm;
          upload_id: string | null;
          class_teacher_comment: string | null;
          principal_comment: string | null;
          class_teacher_id: string | null;
          attendance_present: number | null;
          attendance_absent: number | null;
          affective_domain: Json;
          psychomotor_domain: Json;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["student_term_reports"]["Row"]> &
          Pick<Database["public"]["Tables"]["student_term_reports"]["Row"], "school_id" | "student_id" | "class_id" | "academic_year" | "term">;
        Update: Partial<Database["public"]["Tables"]["student_term_reports"]["Row"]>;
        Relationships: [];
      };
      class_term_report_settings: {
        Row: {
          id: string;
          school_id: string;
          class_id: string;
          academic_year: string;
          term: SchoolTerm;
          school_open_days: number | null;
          term_ends_on: string | null;
          next_term_begins_on: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["class_term_report_settings"]["Row"]> &
          Pick<Database["public"]["Tables"]["class_term_report_settings"]["Row"], "school_id" | "class_id" | "academic_year" | "term">;
        Update: Partial<Database["public"]["Tables"]["class_term_report_settings"]["Row"]>;
        Relationships: [];
      };
      manual_payment_requests: {
        Row: {
          id: string;
          school_id: string;
          subscription_plan: string;
          billing_period: string;
          payment_reference: string;
          amount_expected: number;
          currency: string;
          status: "open" | "submitted" | "approved" | "closed";
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["manual_payment_requests"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["manual_payment_requests"]["Row"],
            "school_id" | "subscription_plan" | "billing_period" | "payment_reference" | "amount_expected"
          >;
        Update: Partial<Database["public"]["Tables"]["manual_payment_requests"]["Row"]>;
        Relationships: [];
      };
      payment_submissions: {
        Row: {
          id: string;
          school_id: string;
          payment_request_id: string;
          subscription_id: string | null;
          payment_reference: string;
          billing_period: string;
          subscription_plan: string;
          amount_expected: number | null;
          amount_paid: number;
          currency: string;
          payer_name: string;
          payer_bank: string;
          bank_transfer_reference: string | null;
          paid_at: string;
          proof_path: string;
          proof_mime_type: "image/jpeg" | "image/png" | "application/pdf";
          note: string | null;
          status: "pending_verification" | "approved" | "rejected" | "cancelled";
          reviewed_by: string | null;
          reviewed_at: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["payment_submissions"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["payment_submissions"]["Row"],
            | "school_id"
            | "payment_request_id"
            | "payment_reference"
            | "billing_period"
            | "subscription_plan"
            | "amount_paid"
            | "payer_name"
            | "payer_bank"
            | "paid_at"
            | "proof_path"
            | "proof_mime_type"
          >;
        Update: Partial<Database["public"]["Tables"]["payment_submissions"]["Row"]>;
        Relationships: [];
      };
      platform_admins: {
        Row: {
          id: string;
          user_id: string;
          role: "owner" | "support" | "finance";
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["platform_admins"]["Row"]> &
          Pick<Database["public"]["Tables"]["platform_admins"]["Row"], "user_id" | "role">;
        Update: Partial<Database["public"]["Tables"]["platform_admins"]["Row"]>;
        Relationships: [];
      };
      platform_audit_logs: {
        Row: {
          id: string;
          platform_admin_id: string | null;
          actor_user_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          details: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["platform_audit_logs"]["Row"]> &
          Pick<Database["public"]["Tables"]["platform_audit_logs"]["Row"], "action">;
        Update: Partial<Database["public"]["Tables"]["platform_audit_logs"]["Row"]>;
        Relationships: [];
      };
      classes: {
        Row: {
          id: string;
          school_id: string;
          name: string;
          level: string;
          arm: string | null;
          academic_year: string;
          teacher_id: string | null;
          is_active: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["classes"]["Row"]> &
          Pick<Database["public"]["Tables"]["classes"]["Row"], "school_id" | "name" | "level" | "academic_year">;
        Update: Partial<Database["public"]["Tables"]["classes"]["Row"]>;
        Relationships: [];
      };
      subjects: {
        Row: {
          id: string;
          school_id: string;
          name: string;
          code: string;
          description: string | null;
          is_active: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["subjects"]["Row"]> &
          Pick<Database["public"]["Tables"]["subjects"]["Row"], "school_id" | "name" | "code">;
        Update: Partial<Database["public"]["Tables"]["subjects"]["Row"]>;
        Relationships: [];
      };
      class_subjects: {
        Row: {
          id: string;
          school_id: string;
          class_id: string;
          subject_id: string;
          teacher_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["class_subjects"]["Row"]> &
          Pick<Database["public"]["Tables"]["class_subjects"]["Row"], "school_id" | "class_id" | "subject_id">;
        Update: Partial<Database["public"]["Tables"]["class_subjects"]["Row"]>;
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          school_id: string;
          class_id: string | null;
          permanent_code: string;
          admission_number: string | null;
          first_name: string;
          middle_name: string | null;
          last_name: string;
          gender: "female" | "male" | "other" | null;
          date_of_birth: string | null;
          passport_url: string | null;
          parent_full_name: string | null;
          parent_email: string | null;
          parent_phone: string | null;
          parent_alt_phone: string | null;
          parent_relationship: string | null;
          address: string | null;
          status: StudentStatus;
          is_active: boolean;
          enrolled_at: string;
          graduated_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["students"]["Row"]> &
          Pick<Database["public"]["Tables"]["students"]["Row"], "school_id" | "first_name" | "last_name">;
        Update: Partial<Database["public"]["Tables"]["students"]["Row"]>;
        Relationships: [];
      };
      student_class_enrollments: {
        Row: {
          id: string;
          school_id: string;
          student_id: string;
          class_id: string;
          academic_year: string;
          status: StudentEnrollmentStatus;
          promoted_from_class_id: string | null;
          promoted_to_class_id: string | null;
          promoted_at: string | null;
          promoted_by: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["student_class_enrollments"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["student_class_enrollments"]["Row"],
            "school_id" | "student_id" | "class_id" | "academic_year"
          >;
        Update: Partial<Database["public"]["Tables"]["student_class_enrollments"]["Row"]>;
        Relationships: [];
      };
      result_uploads: {
        Row: {
          id: string;
          school_id: string;
          class_id: string;
          class_name: string;
          subject: string;
          term: SchoolTerm;
          academic_year: string;
          status: UploadStatus;
          file_name: string;
          source_filename: string | null;
          total_rows: number;
          valid_rows: number;
          invalid_rows: number;
          validation_errors: Json;
          uploaded_by: string | null;
          validated_by: string | null;
          published_by: string | null;
          validated_at: string | null;
          published_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["result_uploads"]["Row"]> &
          Pick<Database["public"]["Tables"]["result_uploads"]["Row"], "school_id" | "class_id" | "term" | "academic_year">;
        Update: Partial<Database["public"]["Tables"]["result_uploads"]["Row"]>;
        Relationships: [];
      };
      results: {
        Row: {
          id: string;
          school_id: string;
          upload_id: string | null;
          student_id: string;
          class_id: string;
          subject_id: string;
          term: SchoolTerm;
          academic_year: string;
          continuous_assessment: number;
          exam_score: number;
          total_score: number;
          grade: string;
          remark: string | null;
          position_in_subject: number | null;
          is_published: boolean;
          published_by: string | null;
          published_at: string | null;
          edited_by: string | null;
          edited_at: string | null;
          edit_count: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["results"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["results"]["Row"],
            "school_id" | "student_id" | "class_id" | "subject_id" | "term" | "academic_year"
          >;
        Update: Partial<Database["public"]["Tables"]["results"]["Row"]>;
        Relationships: [];
      };
      code_term_access: {
        Row: {
          id: string;
          school_id: string;
          student_id: string;
          result_code: string;
          term: SchoolTerm;
          academic_year: string;
          is_active: boolean;
          max_uses: number | null;
          use_count: number;
          expires_at: string | null;
          last_used_at: string | null;
          metadata: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["code_term_access"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["code_term_access"]["Row"],
            "school_id" | "student_id" | "result_code" | "term" | "academic_year"
          >;
        Update: Partial<Database["public"]["Tables"]["code_term_access"]["Row"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          school_id: string | null;
          actor_id: string | null;
          actor_role: AppRole | null;
          action: AuditAction;
          table_name: string;
          record_id: string | null;
          details: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]> &
          Pick<Database["public"]["Tables"]["audit_logs"]["Row"], "action" | "table_name">;
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      calculate_grade: {
        Args: { total_score: number };
        Returns: string;
      };
      can_manage_school_data: {
        Args: { target_school_id: string };
        Returns: boolean;
      };
      can_publish_results: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      current_school_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      current_user_role: {
        Args: Record<string, never>;
        Returns: AppRole | null;
      };
      generate_student_code: {
        Args: { target_school_id: string };
        Returns: string;
      };
      generate_school_code: {
        Args: Record<string, never>;
        Returns: string;
      };
      check_registration_rate_limit: {
        Args: { source_email?: string | null; source_ip: string };
        Returns: boolean;
      };
      finalize_school_registration: {
        Args: Record<string, never>;
        Returns: Json;
      };
      validate_result_upload: {
        Args: { target_upload_id: string };
        Returns: Json;
      };
      recalculate_result_positions: {
        Args: {
          target_school_id: string;
          target_class_id: string;
          target_term: SchoolTerm;
          target_academic_year: string;
        };
        Returns: undefined;
      };
      create_result_upload_for_save: {
        Args: {
          target_class_id: string;
          target_term: SchoolTerm;
          target_academic_year: string;
          replacement_mode: boolean;
          upload_payload: Json;
        };
        Returns: Json;
      };
      get_public_student_result: {
        Args: {
          input_code: string;
          requested_term?: SchoolTerm | null;
          requested_academic_year?: string | null;
        };
        Returns: Json;
      };
      get_staff_invitation: {
        Args: { invite_token: string };
        Returns: Json;
      };
      accept_staff_invitation: {
        Args: { invite_token: string };
        Returns: Json;
      };
    };
    Enums: {
      app_role: AppRole;
      audit_action: AuditAction;
      school_term: SchoolTerm;
      subscription_status: SubscriptionStatus;
      upload_status: UploadStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type PublicTableName = keyof Database["public"]["Tables"];
export type TableRow<TTable extends PublicTableName> = Database["public"]["Tables"][TTable]["Row"];
export type TableInsert<TTable extends PublicTableName> = Database["public"]["Tables"][TTable]["Insert"];
export type TableUpdate<TTable extends PublicTableName> = Database["public"]["Tables"][TTable]["Update"];
