export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole = "admin" | "headmaster" | "teacher" | "parent";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "paused" | "canceled";
export type SchoolTerm = "first" | "second" | "third";
export type UploadStatus = "draft" | "validating" | "validated" | "failed" | "published" | "archived";
export type AuditAction = "insert" | "update" | "delete" | "publish" | "unpublish" | "validate";

export type Database = {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string;
          name: string;
          slug: string;
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
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["schools"]["Row"]> & Pick<Database["public"]["Tables"]["schools"]["Row"], "name" | "slug">;
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
          parent_full_name: string | null;
          parent_email: string | null;
          parent_phone: string | null;
          parent_alt_phone: string | null;
          parent_relationship: string | null;
          address: string | null;
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
      result_uploads: {
        Row: {
          id: string;
          school_id: string;
          class_id: string;
          term: SchoolTerm;
          academic_year: string;
          status: UploadStatus;
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
      validate_result_upload: {
        Args: { target_upload_id: string };
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
