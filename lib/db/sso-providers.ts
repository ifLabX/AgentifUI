/**
 * SSO Providers Database Operations
 * @description Handles all database operations for SSO providers management
 * @module lib/db/sso-providers
 */
import { createClient } from '@lib/supabase/client';
import {
  CreateSsoProviderData,
  SsoProtocol,
  SsoProvider,
} from '@lib/types/database';
import { Result, failure, success } from '@lib/types/result';

// Keep compatibility with existing code patterns
const supabase = createClient();

/**
 * Filter options for SSO providers query
 */
export interface SsoProviderFilters {
  protocol?: SsoProtocol;
  enabled?: boolean;
  search?: string;
  sortBy?: 'name' | 'protocol' | 'created_at' | 'display_order';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * SSO provider statistics for admin dashboard
 */
export interface SsoProviderStats {
  total: number;
  enabled: number;
  disabled: number;
  byProtocol: Record<SsoProtocol, number>;
}

// CreateSsoProviderData is now defined in @lib/types/database

/**
 * Update data for existing SSO provider
 */
export interface UpdateSsoProviderData {
  name?: string;
  protocol?: SsoProtocol;
  settings?: SsoProvider['settings'];
  client_id?: string | null;
  client_secret?: string | null;
  metadata_url?: string | null;
  enabled?: boolean;
  display_order?: number;
  button_text?: string | null;
}

/**
 * Fetch SSO providers list with filtering and pagination
 * @param filters - Query filters and pagination options
 * @returns Result containing providers list and pagination metadata
 */
export async function getSsoProviders(
  filters: SsoProviderFilters = {}
): Promise<
  Result<{
    providers: SsoProvider[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>
> {
  try {
    const {
      protocol,
      enabled,
      search,
      sortBy = 'display_order',
      sortOrder = 'asc',
      page = 1,
      pageSize = 20,
    } = filters;

    let query = supabase.from('sso_providers').select('*', { count: 'exact' });

    // Apply protocol filter
    if (protocol) {
      query = query.eq('protocol', protocol);
    }

    // Apply enabled status filter
    if (enabled !== undefined) {
      query = query.eq('enabled', enabled);
    }

    // Apply search filter on name and button_text
    if (search) {
      query = query.or(`name.ilike.%${search}%,button_text.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: providers, error, count } = await query;

    if (error) {
      console.error('Failed to fetch SSO providers:', error);
      return failure(
        new Error(`Failed to fetch SSO providers: ${error.message}`)
      );
    }

    const totalPages = Math.ceil((count || 0) / pageSize);

    return success({
      providers: providers || [],
      total: count || 0,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Get SSO provider statistics for admin dashboard
 * @returns Result containing provider statistics
 */
export async function getSsoProviderStats(): Promise<Result<SsoProviderStats>> {
  try {
    const { data: providers, error } = await supabase
      .from('sso_providers')
      .select('protocol, enabled');

    if (error) {
      console.error('Failed to fetch SSO provider stats:', error);
      return failure(
        new Error(`Failed to fetch SSO provider stats: ${error.message}`)
      );
    }

    const stats: SsoProviderStats = {
      total: providers?.length || 0,
      enabled: providers?.filter(p => p.enabled).length || 0,
      disabled: providers?.filter(p => !p.enabled).length || 0,
      byProtocol: {
        CAS: 0,
        SAML: 0,
        OAuth2: 0,
        OIDC: 0,
      },
    };

    // Count providers by protocol
    providers?.forEach(provider => {
      stats.byProtocol[provider.protocol as SsoProtocol]++;
    });

    return success(stats);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Get single SSO provider by ID
 * @param id - Provider UUID
 * @returns Result containing provider data or null if not found
 */
export async function getSsoProviderById(
  id: string
): Promise<Result<SsoProvider | null>> {
  try {
    const { data: provider, error } = await supabase
      .from('sso_providers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch SSO provider:', error);
      return failure(
        new Error(`Failed to fetch SSO provider: ${error.message}`)
      );
    }

    return success(provider);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Create new SSO provider
 * @param data - Provider creation data
 * @returns Result containing created provider
 */
export async function createSsoProvider(
  data: CreateSsoProviderData
): Promise<Result<SsoProvider>> {
  try {
    const { data: provider, error } = await supabase
      .from('sso_providers')
      .insert({
        name: data.name,
        protocol: data.protocol,
        settings: data.settings,
        client_id: data.client_id,
        client_secret: data.client_secret,
        metadata_url: data.metadata_url,
        enabled: data.enabled ?? true,
        display_order: data.display_order ?? 0,
        button_text: data.button_text,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create SSO provider:', error);
      return failure(
        new Error(`Failed to create SSO provider: ${error.message}`)
      );
    }

    return success(provider);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Update existing SSO provider
 * @param id - Provider UUID
 * @param data - Provider update data
 * @returns Result containing updated provider
 */
export async function updateSsoProvider(
  id: string,
  data: UpdateSsoProviderData
): Promise<Result<SsoProvider>> {
  try {
    const updateData: any = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    const { data: provider, error } = await supabase
      .from('sso_providers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update SSO provider:', error);
      return failure(
        new Error(`Failed to update SSO provider: ${error.message}`)
      );
    }

    return success(provider);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Delete SSO provider by ID
 * @param id - Provider UUID
 * @returns Result indicating success or failure
 */
export async function deleteSsoProvider(id: string): Promise<Result<void>> {
  try {
    const { error } = await supabase
      .from('sso_providers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete SSO provider:', error);
      return failure(
        new Error(`Failed to delete SSO provider: ${error.message}`)
      );
    }

    return success(undefined);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Toggle SSO provider enabled status
 * @param id - Provider UUID
 * @param enabled - New enabled status
 * @returns Result containing updated provider
 */
export async function toggleSsoProvider(
  id: string,
  enabled: boolean
): Promise<Result<SsoProvider>> {
  return updateSsoProvider(id, { enabled });
}

/**
 * Update display order for multiple SSO providers
 * @param updates - Array of provider ID and new display order
 * @returns Result indicating success or failure
 */
export async function updateSsoProviderOrder(
  updates: Array<{ id: string; display_order: number }>
): Promise<Result<void>> {
  try {
    // Use transaction to ensure all updates succeed or fail together
    const { error } = await supabase.rpc('update_sso_provider_order', {
      updates: updates,
    });

    if (error) {
      console.error('Failed to update SSO provider order:', error);
      return failure(
        new Error(`Failed to update SSO provider order: ${error.message}`)
      );
    }

    return success(undefined);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
}
