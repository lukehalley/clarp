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
          affiliations: Json | null
          ai_summary: string | null
          audit: Json | null
          avatar_url: string | null
          controversies: string[] | null
          created_at: string
          description: string | null
          discord_url: string | null
          entity_type: string | null
          github_intel: Json | null
          github_url: string | null
          id: string
          key_findings: string[] | null
          last_scan_at: string
          legal_entity: Json | null
          liquidity: Json | null
          market_data: Json | null
          name: string
          negative_indicators: Json | null
          positive_indicators: Json | null
          roadmap: Json | null
          security_intel: Json | null
          shipping_history: Json | null
          social_metrics: Json | null
          tags: string[] | null
          team: Json | null
          tech_stack: Json | null
          telegram_url: string | null
          the_story: string | null
          ticker: string | null
          token_address: string | null
          tokenomics: Json | null
          trust_confidence: string
          trust_score: number
          trust_tier: string
          updated_at: string
          website_intel: Json | null
          website_url: string | null
          x_handle: string | null
          x_url: string | null
        }
        Insert: {
          affiliations?: Json | null
          ai_summary?: string | null
          audit?: Json | null
          avatar_url?: string | null
          controversies?: string[] | null
          created_at?: string
          description?: string | null
          discord_url?: string | null
          entity_type?: string | null
          github_intel?: Json | null
          github_url?: string | null
          id?: string
          key_findings?: string[] | null
          last_scan_at?: string
          legal_entity?: Json | null
          liquidity?: Json | null
          market_data?: Json | null
          name: string
          negative_indicators?: Json | null
          positive_indicators?: Json | null
          roadmap?: Json | null
          security_intel?: Json | null
          shipping_history?: Json | null
          social_metrics?: Json | null
          tags?: string[] | null
          team?: Json | null
          tech_stack?: Json | null
          telegram_url?: string | null
          the_story?: string | null
          ticker?: string | null
          token_address?: string | null
          tokenomics?: Json | null
          trust_confidence?: string
          trust_score?: number
          trust_tier?: string
          updated_at?: string
          website_intel?: Json | null
          website_url?: string | null
          x_handle?: string | null
          x_url?: string | null
        }
        Update: {
          affiliations?: Json | null
          ai_summary?: string | null
          audit?: Json | null
          avatar_url?: string | null
          controversies?: string[] | null
          created_at?: string
          description?: string | null
          discord_url?: string | null
          entity_type?: string | null
          github_intel?: Json | null
          github_url?: string | null
          id?: string
          key_findings?: string[] | null
          last_scan_at?: string
          legal_entity?: Json | null
          liquidity?: Json | null
          market_data?: Json | null
          name?: string
          negative_indicators?: Json | null
          positive_indicators?: Json | null
          roadmap?: Json | null
          security_intel?: Json | null
          shipping_history?: Json | null
          social_metrics?: Json | null
          tags?: string[] | null
          team?: Json | null
          tech_stack?: Json | null
          telegram_url?: string | null
          the_story?: string | null
          ticker?: string | null
          token_address?: string | null
          tokenomics?: Json | null
          trust_confidence?: string
          trust_score?: number
          trust_tier?: string
          updated_at?: string
          website_intel?: Json | null
          website_url?: string | null
          x_handle?: string | null
          x_url?: string | null
        }
        Relationships: []
      }
      scan_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          depth: number | null
          error: string | null
          handle: string
          id: string
          progress: number | null
          started_at: string
          status: string
          status_message: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          depth?: number | null
          error?: string | null
          handle: string
          id: string
          progress?: number | null
          started_at?: string
          status?: string
          status_message?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          depth?: number | null
          error?: string | null
          handle?: string
          id?: string
          progress?: number | null
          started_at?: string
          status?: string
          status_message?: string | null
          updated_at?: string
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
