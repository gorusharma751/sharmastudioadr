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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      album_leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string
          program_album_id: string
          studio_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone: string
          program_album_id: string
          studio_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          program_album_id?: string
          studio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "album_leads_program_album_id_fkey"
            columns: ["program_album_id"]
            isOneToOne: false
            referencedRelation: "program_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "album_leads_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      album_settings: {
        Row: {
          created_at: string
          footer_text: string | null
          id: string
          lead_form_button_text: string | null
          lead_form_enabled: boolean | null
          lead_form_fields: Json | null
          lead_form_heading: string | null
          music_url: string | null
          studio_id: string
          updated_at: string
          watermark_enabled: boolean | null
          watermark_position: string | null
        }
        Insert: {
          created_at?: string
          footer_text?: string | null
          id?: string
          lead_form_button_text?: string | null
          lead_form_enabled?: boolean | null
          lead_form_fields?: Json | null
          lead_form_heading?: string | null
          music_url?: string | null
          studio_id: string
          updated_at?: string
          watermark_enabled?: boolean | null
          watermark_position?: string | null
        }
        Update: {
          created_at?: string
          footer_text?: string | null
          id?: string
          lead_form_button_text?: string | null
          lead_form_enabled?: boolean | null
          lead_form_fields?: Json | null
          lead_form_heading?: string | null
          music_url?: string | null
          studio_id?: string
          updated_at?: string
          watermark_enabled?: boolean | null
          watermark_position?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "album_settings_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: true
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string
          email: string | null
          event_dates: Json | null
          event_type: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          phone: string
          services_required: Json | null
          status: string | null
          studio_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_dates?: Json | null
          event_type?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          phone: string
          services_required?: Json | null
          status?: string | null
          studio_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          event_dates?: Json | null
          event_type?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          phone?: string
          services_required?: Json | null
          status?: string | null
          studio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      page_sections: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          page_id: string
          section_type: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          page_id: string
          section_type?: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          page_id?: string
          section_type?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          show_in_nav: boolean | null
          slug: string
          sort_order: number | null
          studio_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          show_in_nav?: boolean | null
          slug: string
          sort_order?: number | null
          studio_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          show_in_nav?: boolean | null
          slug?: string
          sort_order?: number | null
          studio_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_search_requests: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string
          selfie_url: string | null
          status: string | null
          studio_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone: string
          selfie_url?: string | null
          status?: string | null
          studio_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string
          selfie_url?: string | null
          status?: string | null
          studio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_search_requests_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          created_at: string
          default_pages: Json | null
          default_services: Json | null
          default_theme: Json | null
          id: string
          platform_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_pages?: Json | null
          default_services?: Json | null
          default_theme?: Json | null
          id?: string
          platform_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_pages?: Json | null
          default_services?: Json | null
          default_theme?: Json | null
          id?: string
          platform_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      portfolio_albums: {
        Row: {
          category: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_published: boolean | null
          name: string
          sort_order: number | null
          studio_id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          name: string
          sort_order?: number | null
          studio_id: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          name?: string
          sort_order?: number | null
          studio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_albums_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_images: {
        Row: {
          album_id: string
          caption: string | null
          created_at: string
          id: string
          image_url: string
          sort_order: number | null
          studio_id: string
        }
        Insert: {
          album_id: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number | null
          studio_id: string
        }
        Update: {
          album_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number | null
          studio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_images_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "portfolio_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_images_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      program_albums: {
        Row: {
          client_name: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          event_date: string | null
          id: string
          is_published: boolean | null
          music_url: string | null
          name: string
          qr_code_url: string | null
          slug: string | null
          studio_id: string
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          is_published?: boolean | null
          music_url?: string | null
          name: string
          qr_code_url?: string | null
          slug?: string | null
          studio_id: string
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          is_published?: boolean | null
          music_url?: string | null
          name?: string
          qr_code_url?: string | null
          slug?: string | null
          studio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_albums_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      program_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          program_album_id: string
          sort_order: number | null
          studio_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          program_album_id: string
          sort_order?: number | null
          studio_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          program_album_id?: string
          sort_order?: number | null
          studio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_images_program_album_id_fkey"
            columns: ["program_album_id"]
            isOneToOne: false
            referencedRelation: "program_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_images_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_plans: {
        Row: {
          created_at: string
          features: Json | null
          id: string
          is_active: boolean | null
          max_albums: number | null
          max_bookings: number | null
          max_photos: number | null
          name: string
          price: number | null
          storage_limit_gb: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_albums?: number | null
          max_bookings?: number | null
          max_photos?: number | null
          name: string
          price?: number | null
          storage_limit_gb?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_albums?: number | null
          max_bookings?: number | null
          max_photos?: number | null
          name?: string
          price?: number | null
          storage_limit_gb?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          images: Json | null
          is_visible: boolean | null
          price: number | null
          sort_order: number | null
          studio_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          is_visible?: boolean | null
          price?: number | null
          sort_order?: number | null
          studio_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          is_visible?: boolean | null
          price?: number | null
          sort_order?: number | null
          studio_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_members: {
        Row: {
          created_at: string
          id: string
          role: string
          studio_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          studio_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          studio_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_members_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_settings: {
        Row: {
          accent_color: string | null
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          google_drive_folder: string | null
          id: string
          logo_url: string | null
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          primary_color: string | null
          secondary_color: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_youtube: string | null
          studio_id: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          accent_color?: string | null
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          google_drive_folder?: string | null
          id?: string
          logo_url?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_youtube?: string | null
          studio_id: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          accent_color?: string | null
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          google_drive_folder?: string | null
          id?: string
          logo_url?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_youtube?: string | null
          studio_id?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_settings_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: true
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studios: {
        Row: {
          created_at: string
          custom_domain: string | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          name: string
          owner_id: string | null
          saas_plan_id: string | null
          slug: string
          subdomain: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_domain?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          name: string
          owner_id?: string | null
          saas_plan_id?: string | null
          slug: string
          subdomain?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_domain?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          name?: string
          owner_id?: string | null
          saas_plan_id?: string | null
          slug?: string
          subdomain?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studios_saas_plan_id_fkey"
            columns: ["saas_plan_id"]
            isOneToOne: false
            referencedRelation: "saas_plans"
            referencedColumns: ["id"]
          },
        ]
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
      wedding_invitations: {
        Row: {
          bride_name: string
          created_at: string
          event_date: string | null
          groom_name: string
          id: string
          message: string | null
          studio_id: string
          template_id: string | null
          updated_at: string
          venue: string | null
        }
        Insert: {
          bride_name: string
          created_at?: string
          event_date?: string | null
          groom_name: string
          id?: string
          message?: string | null
          studio_id: string
          template_id?: string | null
          updated_at?: string
          venue?: string | null
        }
        Update: {
          bride_name?: string
          created_at?: string
          event_date?: string | null
          groom_name?: string
          id?: string
          message?: string | null
          studio_id?: string
          template_id?: string | null
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_invitations_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_studio_member: { Args: { _studio_id: string }; Returns: boolean }
      is_studio_owner: { Args: { _studio_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "studio_admin"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["super_admin", "studio_admin"],
    },
  },
} as const
