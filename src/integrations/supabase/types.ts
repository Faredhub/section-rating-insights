export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      faculty: {
        Row: {
          created_at: string
          department: string
          email: string
          id: string
          name: string
          position: string
        }
        Insert: {
          created_at?: string
          department: string
          email: string
          id?: string
          name: string
          position: string
        }
        Update: {
          created_at?: string
          department?: string
          email?: string
          id?: string
          name?: string
          position?: string
        }
        Relationships: []
      }
      faculty_assignments: {
        Row: {
          faculty_id: string
          id: string
          section_id: string
          subject_id: string
        }
        Insert: {
          faculty_id: string
          id?: string
          section_id: string
          subject_id: string
        }
        Update: {
          faculty_id?: string
          id?: string
          section_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "faculty_assignments_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_assignments_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty_stats"
            referencedColumns: ["faculty_id"]
          },
          {
            foreignKeyName: "faculty_assignments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      faculty_credentials_ratings: {
        Row: {
          application_oriented_teaching: number
          class_decorum: number
          communication_skills: number
          concept_understanding: number
          content_spread_depth: number
          created_at: string
          engagement: number
          faculty_assignment_id: string
          feedback: string | null
          id: string
          pedagogy_techniques_tools: number
          section_id: string
          student_id: string
          subject_id: string
          teaching_aids: number
        }
        Insert: {
          application_oriented_teaching: number
          class_decorum: number
          communication_skills: number
          concept_understanding: number
          content_spread_depth: number
          created_at?: string
          engagement: number
          faculty_assignment_id: string
          feedback?: string | null
          id?: string
          pedagogy_techniques_tools: number
          section_id: string
          student_id: string
          subject_id: string
          teaching_aids: number
        }
        Update: {
          application_oriented_teaching?: number
          class_decorum?: number
          communication_skills?: number
          concept_understanding?: number
          content_spread_depth?: number
          created_at?: string
          engagement?: number
          faculty_assignment_id?: string
          feedback?: string | null
          id?: string
          pedagogy_techniques_tools?: number
          section_id?: string
          student_id?: string
          subject_id?: string
          teaching_aids?: number
        }
        Relationships: [
          {
            foreignKeyName: "faculty_credentials_ratings_faculty_assignment_id_fkey"
            columns: ["faculty_assignment_id"]
            isOneToOne: false
            referencedRelation: "faculty_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_credentials_ratings_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_credentials_ratings_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          faculty_id: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          faculty_id: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          faculty_id?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty_stats"
            referencedColumns: ["faculty_id"]
          },
        ]
      }
      registration_numbers: {
        Row: {
          created_at: string | null
          id: string
          is_used: boolean | null
          registration_number: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_used?: boolean | null
          registration_number: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_used?: boolean | null
          registration_number?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          id: string
          name: string
          semester_id: string
        }
        Insert: {
          id?: string
          name: string
          semester_id: string
        }
        Update: {
          id?: string
          name?: string
          semester_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
        ]
      }
      semesters: {
        Row: {
          id: string
          name: string
          year_id: string
        }
        Insert: {
          id?: string
          name: string
          year_id: string
        }
        Update: {
          id?: string
          name?: string
          year_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "semesters_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "years"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          created_at: string | null
          id: string
          name: string
          registration_number: string
          section_id: string
          semester_id: string
          updated_at: string | null
          user_id: string
          year_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          registration_number: string
          section_id: string
          semester_id: string
          updated_at?: string | null
          user_id: string
          year_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          registration_number?: string
          section_id?: string
          semester_id?: string
          updated_at?: string | null
          user_id?: string
          year_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_year_id_fkey"
            columns: ["year_id"]
            isOneToOne: false
            referencedRelation: "years"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          id: string
          name: string
          section_id: string
        }
        Insert: {
          id?: string
          name: string
          section_id: string
        }
        Update: {
          id?: string
          name?: string
          section_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      years: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      faculty_stats: {
        Row: {
          average_rating: number | null
          department: string | null
          faculty_id: string | null
          faculty_name: string | null
          position: string | null
          total_ratings: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
