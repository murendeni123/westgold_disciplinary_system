/**
 * Supabase Database Types
 * 
 * These types mirror the database schema and provide type safety
 * for all Supabase queries. Update these when the schema changes.
 */

export type UserRole = 'super_admin' | 'school_admin' | 'teacher' | 'parent';

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          role: UserRole;
          school_id: string | null;
          full_name: string | null;
          whatsapp_number: string | null;
          whatsapp_opt_in: boolean;
          notification_preferences: NotificationPreferences | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: UserRole;
          school_id?: string | null;
          full_name?: string | null;
          whatsapp_number?: string | null;
          whatsapp_opt_in?: boolean;
          notification_preferences?: NotificationPreferences | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          school_id?: string | null;
          full_name?: string | null;
          whatsapp_number?: string | null;
          whatsapp_opt_in?: boolean;
          notification_preferences?: NotificationPreferences | null;
          updated_at?: string;
        };
      };
      user_schools: {
        Row: {
          id: number;
          user_id: string;
          school_id: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          school_id: number;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          school_id?: number;
        };
      };
      schools: {
        Row: {
          id: number;
          name: string;
          email: string | null;
          code: string | null;
          status: 'active' | 'inactive' | 'suspended';
          created_at: string;
        };
        Insert: {
          name: string;
          email?: string | null;
          code?: string | null;
          status?: 'active' | 'inactive' | 'suspended';
          created_at?: string;
        };
        Update: {
          name?: string;
          email?: string | null;
          code?: string | null;
          status?: 'active' | 'inactive' | 'suspended';
        };
      };
      audit_logs: {
        Row: {
          id: number;
          school_id: string;
          actor_user_id: string;
          actor_role: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          description: string | null;
          metadata: Record<string, any> | null;
          created_at: string;
        };
        Insert: {
          school_id: string;
          actor_user_id: string;
          actor_role: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          description?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
        };
        Update: {
          school_id?: string;
          actor_user_id?: string;
          actor_role?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          description?: string | null;
          metadata?: Record<string, any> | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
    };
  };
}

// Notification preferences structure stored as JSONB
export interface NotificationPreferences {
  attendance?: boolean;
  incidents?: boolean;
  merits?: boolean;
  detentions?: boolean;
  email?: boolean;
  push?: boolean;
}

// Convenience type for user profile row
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

// Convenience type for user school row
export type UserSchool = Database['public']['Tables']['user_schools']['Row'];

// Convenience type for school row
export type School = Database['public']['Tables']['schools']['Row'];

// Convenience type for audit log row
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
