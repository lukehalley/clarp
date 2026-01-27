// Generated Supabase types - DO NOT EDIT MANUALLY
// Regenerate with: mcp__supabase__generate_typescript_types

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
      projects: {
        Row: {
          ai_summary: string | null
          avatar_url: string | null
          created_at: string
          description: string | null
          github_url: string | null
          github_intel: Json | null
          id: string
          last_scan_at: string
          market_data: Json | null
          name: string
          shipping_history: Json | null
          social_metrics: Json | null
          tags: string[] | null
          team: Json | null
          ticker: string | null
          token_address: string | null
          trust_confidence: string
          trust_score: number
          trust_tier: string
          updated_at: string
          website_url: string | null
          website_intel: Json | null
          x_handle: string | null
        }
        Insert: {
          ai_summary?: string | null
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          github_url?: string | null
          github_intel?: Json | null
          id?: string
          last_scan_at?: string
          market_data?: Json | null
          name: string
          shipping_history?: Json | null
          social_metrics?: Json | null
          tags?: string[] | null
          team?: Json | null
          ticker?: string | null
          token_address?: string | null
          trust_confidence?: string
          trust_score?: number
          trust_tier?: string
          updated_at?: string
          website_url?: string | null
          website_intel?: Json | null
          x_handle?: string | null
        }
        Update: {
          ai_summary?: string | null
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          github_url?: string | null
          github_intel?: Json | null
          id?: string
          last_scan_at?: string
          market_data?: Json | null
          name?: string
          shipping_history?: Json | null
          social_metrics?: Json | null
          tags?: string[] | null
          team?: Json | null
          ticker?: string | null
          token_address?: string | null
          trust_confidence?: string
          trust_score?: number
          trust_tier?: string
          updated_at?: string
          website_url?: string | null
          website_intel?: Json | null
          x_handle?: string | null
        }
        Relationships: []
      }
      token_cache: {
        Row: {
          chain: string
          created_at: string
          dex_type: string | null
          id: string
          image_url: string | null
          name: string | null
          pool_address: string | null
          symbol: string | null
          ticker: string
          token_address: string
          updated_at: string
        }
        Insert: {
          chain?: string
          created_at?: string
          dex_type?: string | null
          id?: string
          image_url?: string | null
          name?: string | null
          pool_address?: string | null
          symbol?: string | null
          ticker: string
          token_address: string
          updated_at?: string
        }
        Update: {
          chain?: string
          created_at?: string
          dex_type?: string | null
          id?: string
          image_url?: string | null
          name?: string | null
          pool_address?: string | null
          symbol?: string | null
          ticker?: string
          token_address?: string
          updated_at?: string
        }
        Relationships: []
      }
      xintel_reports: {
        Row: {
          expires_at: string
          handle: string
          report: Json
          scanned_at: string
        }
        Insert: {
          expires_at: string
          handle: string
          report: Json
          scanned_at?: string
        }
        Update: {
          expires_at?: string
          handle?: string
          report?: Json
          scanned_at?: string
        }
        Relationships: []
      }
      scan_jobs: {
        Row: {
          id: string
          handle: string
          depth: number
          status: string
          progress: number
          status_message: string | null
          started_at: string
          completed_at: string | null
          error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          handle: string
          depth?: number
          status?: string
          progress?: number
          status_message?: string | null
          started_at?: string
          completed_at?: string | null
          error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          handle?: string
          depth?: number
          status?: string
          progress?: number
          status_message?: string | null
          started_at?: string
          completed_at?: string | null
          error?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type ProjectRow = Database['public']['Tables']['projects']['Row']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export type TokenCacheRow = Database['public']['Tables']['token_cache']['Row']
export type XIntelReportRow = Database['public']['Tables']['xintel_reports']['Row']
export type ScanJobRow = Database['public']['Tables']['scan_jobs']['Row']
