export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      approvals: {
        Row: {
          approval_kind: Database["public"]["Enums"]["approval_kind"]
          approved_on: string | null
          approver_name: string | null
          comment: string | null
          created_at: string
          created_by: string | null
          decision: Database["public"]["Enums"]["approval_decision"]
          file_path: string | null
          id: string
          reference_no: string | null
          request_id: string
        }
        Insert: {
          approval_kind?: Database["public"]["Enums"]["approval_kind"]
          approved_on?: string | null
          approver_name?: string | null
          comment?: string | null
          created_at?: string
          created_by?: string | null
          decision?: Database["public"]["Enums"]["approval_decision"]
          file_path?: string | null
          id?: string
          reference_no?: string | null
          request_id: string
        }
        Update: {
          approval_kind?: Database["public"]["Enums"]["approval_kind"]
          approved_on?: string | null
          approver_name?: string | null
          comment?: string | null
          created_at?: string
          created_by?: string | null
          decision?: Database["public"]["Enums"]["approval_decision"]
          file_path?: string | null
          id?: string
          reference_no?: string | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      departments: {
        Row: {
          code: string
          created_at: string
          directorate_id: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          directorate_id: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          directorate_id?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_directorate_id_fkey"
            columns: ["directorate_id"]
            isOneToOne: false
            referencedRelation: "directorates"
            referencedColumns: ["id"]
          },
        ]
      }
      directorates: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      generated_documents: {
        Row: {
          body_snapshot: string
          cc_list: string | null
          created_at: string
          created_by: string | null
          doc_kind: Database["public"]["Enums"]["doc_kind"]
          id: string
          issued_at: string | null
          reference_no: string
          request_id: string
          signatory_name: string | null
          signatory_title: string | null
          status: string
          subject: string
          template_id: string | null
          version: number
        }
        Insert: {
          body_snapshot: string
          cc_list?: string | null
          created_at?: string
          created_by?: string | null
          doc_kind?: Database["public"]["Enums"]["doc_kind"]
          id?: string
          issued_at?: string | null
          reference_no: string
          request_id: string
          signatory_name?: string | null
          signatory_title?: string | null
          status?: string
          subject: string
          template_id?: string | null
          version?: number
        }
        Update: {
          body_snapshot?: string
          cc_list?: string | null
          created_at?: string
          created_by?: string | null
          doc_kind?: Database["public"]["Enums"]["doc_kind"]
          id?: string
          issued_at?: string | null
          reference_no?: string
          request_id?: string
          signatory_name?: string | null
          signatory_title?: string | null
          status?: string
          subject?: string
          template_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "generated_documents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "memo_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_items: {
        Row: {
          amount: number | null
          confirmation_no: string | null
          created_at: string
          end_at: string | null
          file_path: string | null
          id: string
          item_type: Database["public"]["Enums"]["logistics_item_type"]
          location: string | null
          notes: string | null
          request_id: string
          start_at: string | null
          vendor_name: string | null
        }
        Insert: {
          amount?: number | null
          confirmation_no?: string | null
          created_at?: string
          end_at?: string | null
          file_path?: string | null
          id?: string
          item_type: Database["public"]["Enums"]["logistics_item_type"]
          location?: string | null
          notes?: string | null
          request_id: string
          start_at?: string | null
          vendor_name?: string | null
        }
        Update: {
          amount?: number | null
          confirmation_no?: string | null
          created_at?: string
          end_at?: string | null
          file_path?: string | null
          id?: string
          item_type?: Database["public"]["Enums"]["logistics_item_type"]
          location?: string | null
          notes?: string | null
          request_id?: string
          start_at?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logistics_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      memo_templates: {
        Row: {
          body: string
          code: string
          created_at: string
          default_cc: string | null
          default_signatory: string | null
          id: string
          is_active: boolean
          subject: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          code: string
          created_at?: string
          default_cc?: string | null
          default_signatory?: string | null
          id?: string
          is_active?: boolean
          subject: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          code?: string
          created_at?: string
          default_cc?: string | null
          default_signatory?: string | null
          id?: string
          is_active?: boolean
          subject?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department_id: string | null
          directorate_id: string | null
          full_name: string
          id: string
          is_active: boolean
          official_email: string
          phone: string | null
          rank_title: string | null
          role: Database["public"]["Enums"]["app_role"]
          staff_id_number: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          directorate_id?: string | null
          full_name: string
          id: string
          is_active?: boolean
          official_email: string
          phone?: string | null
          rank_title?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          staff_id_number: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          directorate_id?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          official_email?: string
          phone?: string | null
          rank_title?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          staff_id_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_directorate_id_fkey"
            columns: ["directorate_id"]
            isOneToOne: false
            referencedRelation: "directorates"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          account_name: string | null
          account_number: string | null
          bank_name: string | null
          claimed_amount: number | null
          created_at: string
          id: string
          paid_on: string | null
          payment_ref: string | null
          recommended_amount: number | null
          refund_kind: string
          request_id: string
          status: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          claimed_amount?: number | null
          created_at?: string
          id?: string
          paid_on?: string | null
          payment_ref?: string | null
          recommended_amount?: number | null
          refund_kind?: string
          request_id: string
          status?: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          claimed_amount?: number | null
          created_at?: string
          id?: string
          paid_on?: string | null
          payment_ref?: string | null
          recommended_amount?: number | null
          refund_kind?: string
          request_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_activity: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string
          detail: string | null
          id: string
          request_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          request_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_activity_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_documents: {
        Row: {
          created_at: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          file_name: string
          file_path: string
          id: string
          request_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          doc_type?: Database["public"]["Enums"]["doc_type"]
          file_name: string
          file_path: string
          id?: string
          request_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          doc_type?: Database["public"]["Enums"]["doc_type"]
          file_name?: string
          file_path?: string
          id?: string
          request_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_documents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          agency_id: string | null
          amount_approved: number | null
          amount_requested: number | null
          approval_required: boolean
          assigned_officer_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          department_id: string | null
          destination: string | null
          directorate_id: string | null
          id: string
          notes: string | null
          on_behalf_of_staff_id: string | null
          origin_city: string | null
          principal_type: Database["public"]["Enums"]["principal_type"]
          purpose: string | null
          reference_no: string
          requester_staff_id: string
          status: Database["public"]["Enums"]["request_status"]
          travel_scope: Database["public"]["Enums"]["travel_scope"] | null
          trip_end: string | null
          trip_start: string | null
          type: Database["public"]["Enums"]["request_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          agency_id?: string | null
          amount_approved?: number | null
          amount_requested?: number | null
          approval_required?: boolean
          assigned_officer_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          department_id?: string | null
          destination?: string | null
          directorate_id?: string | null
          id?: string
          notes?: string | null
          on_behalf_of_staff_id?: string | null
          origin_city?: string | null
          principal_type?: Database["public"]["Enums"]["principal_type"]
          purpose?: string | null
          reference_no: string
          requester_staff_id: string
          status?: Database["public"]["Enums"]["request_status"]
          travel_scope?: Database["public"]["Enums"]["travel_scope"] | null
          trip_end?: string | null
          trip_start?: string | null
          type: Database["public"]["Enums"]["request_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          agency_id?: string | null
          amount_approved?: number | null
          amount_requested?: number | null
          approval_required?: boolean
          assigned_officer_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          department_id?: string | null
          destination?: string | null
          directorate_id?: string | null
          id?: string
          notes?: string | null
          on_behalf_of_staff_id?: string | null
          origin_city?: string | null
          principal_type?: Database["public"]["Enums"]["principal_type"]
          purpose?: string | null
          reference_no?: string
          requester_staff_id?: string
          status?: Database["public"]["Enums"]["request_status"]
          travel_scope?: Database["public"]["Enums"]["travel_scope"] | null
          trip_end?: string | null
          trip_start?: string | null
          type?: Database["public"]["Enums"]["request_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requests_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "travel_agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_directorate_id_fkey"
            columns: ["directorate_id"]
            isOneToOne: false
            referencedRelation: "directorates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_on_behalf_of_staff_id_fkey"
            columns: ["on_behalf_of_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_requester_staff_id_fkey"
            columns: ["requester_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_records"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_records: {
        Row: {
          account_name: string | null
          account_number: string | null
          bank_name: string | null
          created_at: string
          department_id: string | null
          directorate_id: string | null
          full_name: string
          id: string
          is_active: boolean
          nationality: string | null
          official_email: string | null
          passport_expiry: string | null
          passport_number: string | null
          phone: string | null
          rank_title: string | null
          staff_id_number: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          department_id?: string | null
          directorate_id?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          nationality?: string | null
          official_email?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          phone?: string | null
          rank_title?: string | null
          staff_id_number: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          department_id?: string | null
          directorate_id?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          nationality?: string | null
          official_email?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          phone?: string | null
          rank_title?: string | null
          staff_id_number?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_records_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_records_directorate_id_fkey"
            columns: ["directorate_id"]
            isOneToOne: false
            referencedRelation: "directorates"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          agency_id: string | null
          airline: string | null
          amount: number | null
          cabin_class: string | null
          created_at: string
          created_by: string | null
          depart_at: string | null
          id: string
          invoice_no: string | null
          pnr: string | null
          request_id: string
          return_at: string | null
          route: string | null
          ticket_file: string | null
          ticket_number: string | null
        }
        Insert: {
          agency_id?: string | null
          airline?: string | null
          amount?: number | null
          cabin_class?: string | null
          created_at?: string
          created_by?: string | null
          depart_at?: string | null
          id?: string
          invoice_no?: string | null
          pnr?: string | null
          request_id: string
          return_at?: string | null
          route?: string | null
          ticket_file?: string | null
          ticket_number?: string | null
        }
        Update: {
          agency_id?: string | null
          airline?: string | null
          amount?: number | null
          cabin_class?: string | null
          created_at?: string
          created_by?: string | null
          depart_at?: string | null
          id?: string
          invoice_no?: string | null
          pnr?: string | null
          request_id?: string
          return_at?: string | null
          route?: string | null
          ticket_file?: string | null
          ticket_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "travel_agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_agencies: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_see_request: {
        Args: { _request_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_protocol: { Args: { _user_id: string }; Returns: boolean }
      is_staff_owner: {
        Args: { _staff_record: string; _user_id: string }
        Returns: boolean
      }
      next_memo_reference: {
        Args: { _kind: Database["public"]["Enums"]["doc_kind"] }
        Returns: string
      }
      next_reference: {
        Args: { _type: Database["public"]["Enums"]["request_type"] }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "protocol_officer"
        | "protocol_head"
        | "approver"
        | "staff"
      approval_decision: "pending" | "approved" | "queried" | "rejected"
      approval_kind: "dgca" | "ministerial"
      doc_kind: "memo" | "intro_letter"
      doc_type:
        | "passport_biodata"
        | "staff_id_card"
        | "approval_letter"
        | "ticket"
        | "receipt"
        | "visa_receipt"
        | "invoice"
        | "other"
      logistics_item_type:
        | "hotel"
        | "transport"
        | "hall"
        | "flight"
        | "meet_assist"
      principal_type: "staff" | "guest" | "dgca"
      request_status:
        | "draft"
        | "awaiting_approval"
        | "approved"
        | "documents_pending"
        | "memo_raised"
        | "with_agency"
        | "ticket_issued"
        | "under_review"
        | "recommended_for_payment"
        | "closed"
        | "queried"
        | "rejected"
      request_type:
        | "ticket"
        | "ticket_refund"
        | "visa_refund"
        | "intro_letter"
        | "logistics"
      travel_scope: "domestic" | "international"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "protocol_officer",
        "protocol_head",
        "approver",
        "staff",
      ],
      approval_decision: ["pending", "approved", "queried", "rejected"],
      approval_kind: ["dgca", "ministerial"],
      doc_kind: ["memo", "intro_letter"],
      doc_type: [
        "passport_biodata",
        "staff_id_card",
        "approval_letter",
        "ticket",
        "receipt",
        "visa_receipt",
        "invoice",
        "other",
      ],
      logistics_item_type: [
        "hotel",
        "transport",
        "hall",
        "flight",
        "meet_assist",
      ],
      principal_type: ["staff", "guest", "dgca"],
      request_status: [
        "draft",
        "awaiting_approval",
        "approved",
        "documents_pending",
        "memo_raised",
        "with_agency",
        "ticket_issued",
        "under_review",
        "recommended_for_payment",
        "closed",
        "queried",
        "rejected",
      ],
      request_type: [
        "ticket",
        "ticket_refund",
        "visa_refund",
        "intro_letter",
        "logistics",
      ],
      travel_scope: ["domestic", "international"],
    },
  },
} as const
