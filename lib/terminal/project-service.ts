// Project Service - CRUD operations for unified project entities
// "Trustpilot + Google Maps + Rugchecker for crypto"

import { getSupabaseClient, isSupabaseAvailable } from '@/lib/supabase/client';
import type { ProjectRow, ProjectInsert, ProjectUpdate } from '@/types/supabase';
import type { Project, TrustTier, TeamMember } from '@/types/project';

// ============================================================================
// TYPE CONVERTERS
// ============================================================================

/**
 * Convert database row to Project type
 */
export function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    avatarUrl: row.avatar_url || undefined,
    tags: row.tags || [],
    aiSummary: row.ai_summary || undefined,
    xHandle: row.x_handle || undefined,
    githubUrl: row.github_url || undefined,
    websiteUrl: row.website_url || undefined,
    tokenAddress: row.token_address || undefined,
    ticker: row.ticker || undefined,
    trustScore: {
      score: row.trust_score,
      tier: row.trust_tier as TrustTier,
      confidence: row.trust_confidence as 'low' | 'medium' | 'high',
      lastUpdated: new Date(row.updated_at),
    },
    team: (row.team as unknown as TeamMember[]) || [],
    marketData: row.market_data as unknown as Project['marketData'] || undefined,
    githubIntel: row.github_intel as unknown as Project['githubIntel'] || undefined,
    websiteIntel: row.website_intel as unknown as Project['websiteIntel'] || undefined,
    socialMetrics: row.social_metrics as unknown as Project['socialMetrics'] || undefined,
    lastScanAt: new Date(row.last_scan_at),
    createdAt: new Date(row.created_at),
  };
}

/**
 * Convert Project type to database insert
 */
export function projectToInsert(project: Partial<Project> & { name: string }): ProjectInsert {
  return {
    name: project.name,
    description: project.description || null,
    avatar_url: project.avatarUrl || null,
    tags: project.tags || [],
    ai_summary: project.aiSummary || null,
    x_handle: project.xHandle || null,
    github_url: project.githubUrl || null,
    website_url: project.websiteUrl || null,
    token_address: project.tokenAddress || null,
    ticker: project.ticker || null,
    trust_score: project.trustScore?.score || 50,
    trust_confidence: project.trustScore?.confidence || 'low',
    team: (project.team || []) as unknown as ProjectInsert['team'],
    market_data: (project.marketData || null) as unknown as ProjectInsert['market_data'],
    github_intel: (project.githubIntel || null) as unknown as ProjectInsert['github_intel'],
    website_intel: (project.websiteIntel || null) as unknown as ProjectInsert['website_intel'],
    social_metrics: (project.socialMetrics || null) as unknown as ProjectInsert['social_metrics'],
  };
}

/**
 * Convert partial Project to database update
 */
export function projectToUpdate(updates: Partial<Project>): ProjectUpdate {
  const result: ProjectUpdate = {};

  if (updates.name !== undefined) result.name = updates.name;
  if (updates.description !== undefined) result.description = updates.description || null;
  if (updates.avatarUrl !== undefined) result.avatar_url = updates.avatarUrl || null;
  if (updates.tags !== undefined) result.tags = updates.tags;
  if (updates.aiSummary !== undefined) result.ai_summary = updates.aiSummary || null;
  if (updates.xHandle !== undefined) result.x_handle = updates.xHandle || null;
  if (updates.githubUrl !== undefined) result.github_url = updates.githubUrl || null;
  if (updates.websiteUrl !== undefined) result.website_url = updates.websiteUrl || null;
  if (updates.tokenAddress !== undefined) result.token_address = updates.tokenAddress || null;
  if (updates.ticker !== undefined) result.ticker = updates.ticker || null;
  if (updates.trustScore !== undefined) {
    result.trust_score = updates.trustScore.score;
    result.trust_confidence = updates.trustScore.confidence;
  }
  if (updates.team !== undefined) result.team = updates.team as unknown as ProjectUpdate['team'];
  if (updates.marketData !== undefined) result.market_data = (updates.marketData || null) as unknown as ProjectUpdate['market_data'];
  if (updates.githubIntel !== undefined) result.github_intel = (updates.githubIntel || null) as unknown as ProjectUpdate['github_intel'];
  if (updates.websiteIntel !== undefined) result.website_intel = (updates.websiteIntel || null) as unknown as ProjectUpdate['website_intel'];
  if (updates.socialMetrics !== undefined) result.social_metrics = (updates.socialMetrics || null) as unknown as ProjectUpdate['social_metrics'];
  if (updates.lastScanAt !== undefined) result.last_scan_at = updates.lastScanAt.toISOString();

  return result;
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Get project by ID
 */
export async function getProjectById(id: string): Promise<Project | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('[ProjectService] Error fetching project:', error.message);
      }
      return null;
    }

    return rowToProject(data as ProjectRow);
  } catch (err) {
    console.error('[ProjectService] Failed to fetch project:', err);
    return null;
  }
}

/**
 * Get project by X handle
 */
export async function getProjectByHandle(handle: string): Promise<Project | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  // Normalize handle (remove @ prefix)
  const normalizedHandle = handle.replace(/^@/, '').toLowerCase();

  try {
    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('x_handle', normalizedHandle)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('[ProjectService] Error fetching project by handle:', error.message);
      }
      return null;
    }

    return rowToProject(data as ProjectRow);
  } catch (err) {
    console.error('[ProjectService] Failed to fetch project by handle:', err);
    return null;
  }
}

/**
 * Get project by ticker
 */
export async function getProjectByTicker(ticker: string): Promise<Project | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  // Normalize ticker (remove $ prefix, uppercase)
  const normalizedTicker = ticker.replace(/^\$/, '').toUpperCase();

  try {
    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('ticker', normalizedTicker)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('[ProjectService] Error fetching project by ticker:', error.message);
      }
      return null;
    }

    return rowToProject(data as ProjectRow);
  } catch (err) {
    console.error('[ProjectService] Failed to fetch project by ticker:', err);
    return null;
  }
}

/**
 * Get project by token address
 */
export async function getProjectByTokenAddress(address: string): Promise<Project | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('token_address', address)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('[ProjectService] Error fetching project by address:', error.message);
      }
      return null;
    }

    return rowToProject(data as ProjectRow);
  } catch (err) {
    console.error('[ProjectService] Failed to fetch project by address:', err);
    return null;
  }
}

/**
 * Search for project by any identifier
 */
export async function findProject(query: string): Promise<Project | null> {
  // Try each identifier type
  const trimmed = query.trim();

  // X handle
  if (trimmed.startsWith('@')) {
    return getProjectByHandle(trimmed);
  }

  // Ticker
  if (trimmed.startsWith('$')) {
    return getProjectByTicker(trimmed);
  }

  // Solana address
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) {
    return getProjectByTokenAddress(trimmed);
  }

  // Try name search
  return searchProjectByName(trimmed);
}

/**
 * Search project by name (fuzzy match)
 */
export async function searchProjectByName(name: string): Promise<Project | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('projects')
      .select('*')
      .ilike('name', `%${name}%`)
      .limit(1)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('[ProjectService] Error searching project:', error.message);
      }
      return null;
    }

    return rowToProject(data as ProjectRow);
  } catch (err) {
    console.error('[ProjectService] Failed to search project:', err);
    return null;
  }
}

/**
 * Create a new project
 */
export async function createProject(project: Partial<Project> & { name: string }): Promise<Project | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const insert = projectToInsert(project);
    const { data, error } = await client
      .from('projects')
      .insert(insert)
      .select()
      .single();

    if (error) {
      console.error('[ProjectService] Error creating project:', error.message);
      return null;
    }

    console.log(`[ProjectService] Created project: ${project.name}`);
    return rowToProject(data as ProjectRow);
  } catch (err) {
    console.error('[ProjectService] Failed to create project:', err);
    return null;
  }
}

/**
 * Delete a project by ID
 */
export async function deleteProject(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[ProjectService] Error deleting project:', error.message);
      return false;
    }

    console.log(`[ProjectService] Deleted project: ${id}`);
    return true;
  } catch (err) {
    console.error('[ProjectService] Failed to delete project:', err);
    return false;
  }
}

/**
 * Delete a project by X handle
 */
export async function deleteProjectByHandle(handle: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const normalizedHandle = handle.replace(/^@/, '').toLowerCase();

  try {
    const { error } = await client
      .from('projects')
      .delete()
      .eq('x_handle', normalizedHandle);

    if (error) {
      console.error('[ProjectService] Error deleting project by handle:', error.message);
      return false;
    }

    console.log(`[ProjectService] Deleted project: @${normalizedHandle}`);
    return true;
  } catch (err) {
    console.error('[ProjectService] Failed to delete project by handle:', err);
    return false;
  }
}

/**
 * Update an existing project
 */
export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const updateData = projectToUpdate(updates);
    const { data, error } = await client
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[ProjectService] Error updating project:', error.message);
      return null;
    }

    console.log(`[ProjectService] Updated project: ${id}`);
    return rowToProject(data as ProjectRow);
  } catch (err) {
    console.error('[ProjectService] Failed to update project:', err);
    return null;
  }
}

/**
 * Upsert project by X handle
 */
export async function upsertProjectByHandle(
  handle: string,
  project: Partial<Project> & { name: string }
): Promise<Project | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const normalizedHandle = handle.replace(/^@/, '').toLowerCase();

  try {
    const insert = {
      ...projectToInsert(project),
      x_handle: normalizedHandle,
      last_scan_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('projects')
      .upsert(insert, { onConflict: 'x_handle' })
      .select()
      .single();

    if (error) {
      console.error('[ProjectService] Error upserting project:', error.message);
      return null;
    }

    console.log(`[ProjectService] Upserted project: @${normalizedHandle}`);
    return rowToProject(data as ProjectRow);
  } catch (err) {
    console.error('[ProjectService] Failed to upsert project:', err);
    return null;
  }
}

// ============================================================================
// LIST & FEED OPERATIONS
// ============================================================================

export interface ListProjectsOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'last_scan_at' | 'created_at' | 'trust_score' | 'name';
  order?: 'asc' | 'desc';
  trustTier?: TrustTier;
  minScore?: number;
  maxScore?: number;
}

/**
 * List projects with filtering and pagination
 */
export async function listProjects(options: ListProjectsOptions = {}): Promise<Project[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const {
    limit = 20,
    offset = 0,
    orderBy = 'last_scan_at',
    order = 'desc',
    trustTier,
    minScore,
    maxScore,
  } = options;

  try {
    let query = client
      .from('projects')
      .select('*');

    // Apply filters
    if (trustTier) {
      query = query.eq('trust_tier', trustTier);
    }
    if (minScore !== undefined) {
      query = query.gte('trust_score', minScore);
    }
    if (maxScore !== undefined) {
      query = query.lte('trust_score', maxScore);
    }

    // Apply ordering and pagination
    query = query
      .order(orderBy, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('[ProjectService] Error listing projects:', error.message);
      return [];
    }

    return (data || []).map(row => rowToProject(row as ProjectRow));
  } catch (err) {
    console.error('[ProjectService] Failed to list projects:', err);
    return [];
  }
}

/**
 * Get recent projects (for feed)
 */
export async function getRecentProjects(limit: number = 20): Promise<Project[]> {
  return listProjects({ limit, orderBy: 'last_scan_at', order: 'desc' });
}

/**
 * Get top trusted projects
 */
export async function getTopTrustedProjects(limit: number = 10): Promise<Project[]> {
  return listProjects({ limit, orderBy: 'trust_score', order: 'desc', minScore: 70 });
}

/**
 * Get projects needing caution
 */
export async function getCautionProjects(limit: number = 10): Promise<Project[]> {
  return listProjects({ limit, orderBy: 'trust_score', order: 'asc', maxScore: 40 });
}

/**
 * Count total projects
 */
export async function countProjects(): Promise<number> {
  const client = getSupabaseClient();
  if (!client) return 0;

  try {
    const { count, error } = await client
      .from('projects')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('[ProjectService] Error counting projects:', error.message);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('[ProjectService] Failed to count projects:', err);
    return 0;
  }
}

/**
 * Search projects by name (returns multiple)
 */
export async function searchProjects(query: string, limit: number = 10): Promise<Project[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('projects')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('trust_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[ProjectService] Error searching projects:', error.message);
      return [];
    }

    return (data || []).map(row => rowToProject(row as ProjectRow));
  } catch (err) {
    console.error('[ProjectService] Failed to search projects:', err);
    return [];
  }
}

// ============================================================================
// UTILITY
// ============================================================================

/**
 * Check if project service is available
 */
export function isProjectServiceAvailable(): boolean {
  return isSupabaseAvailable();
}
