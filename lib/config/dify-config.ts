import { createClient } from '../supabase/client';
import { decryptApiKey } from '../utils/encryption';

export interface DifyAppConfig {
  apiKey: string;
  apiUrl: string;
  appId: string;
  displayName?: string;
  description?: string;
  appType?: string;
}

// Cache for configuration to avoid repeated requests
// Added cache management functions for manual clearing and validation
const configCache: Record<
  string,
  { config: DifyAppConfig; timestamp: number }
> = {};
const CACHE_TTL = 2 * 60 * 1000; // Cache for 2 minutes to improve config update responsiveness

/**
 * Clear the configuration cache for a specific appId.
 * If appId is not provided, clear all cache.
 * @param appId Application ID (optional)
 */
export const clearDifyConfigCache = (appId?: string): void => {
  if (appId) {
    delete configCache[appId];
    console.log(`[Dify Config Cache] Cleared cache for ${appId}`);
  } else {
    Object.keys(configCache).forEach(key => delete configCache[key]);
    console.log('[Dify Config Cache] Cleared all cache');
  }
};

/**
 * Force refresh the configuration cache for a specific appId.
 * @param appId Application ID
 * @returns Refreshed configuration
 */
export const refreshDifyConfigCache = async (
  appId: string
): Promise<DifyAppConfig | null> => {
  console.log(`[Dify Config Cache] Force refresh config for ${appId}`);
  clearDifyConfigCache(appId);
  return await getDifyAppConfig(appId);
};

/**
 * Get Dify application configuration.
 * Fetch from database, support cache and force refresh.
 * @param appId Dify application ID
 * @param forceRefresh Whether to force refresh and skip cache
 * @returns Dify application config, including apiKey and apiUrl
 */
export const getDifyAppConfig = async (
  appId: string,
  forceRefresh: boolean = false
): Promise<DifyAppConfig | null> => {
  // If force refresh, clear cache
  if (forceRefresh) {
    clearDifyConfigCache(appId);
  }

  // Check cache
  const cached = configCache[appId];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL && !forceRefresh) {
    console.log(`[Get Dify Config] Using cached config: ${appId}`);
    return cached.config;
  }

  try {
    // Fetch config from database
    const config = await getDifyConfigFromDatabase(appId);

    if (config) {
      console.log(
        `[Get Dify Config] Successfully fetched config from database`
      );

      // Update cache
      configCache[appId] = {
        config,
        timestamp: Date.now(),
      };

      return config;
    } else {
      console.error(
        `[Get Dify Config] No config found in database for ${appId}`
      );

      return null;
    }
  } catch (error) {
    console.error(
      `[Get Dify Config] Error fetching config for ${appId}:`,
      error
    );
    return null;
  }
};

/**
 * Fetch application configuration from database (supports multiple providers)
 * @param appId Application ID
 * @returns Application configuration
 */
async function getDifyConfigFromDatabase(
  appId: string
): Promise<DifyAppConfig | null> {
  // Initialize Supabase client
  const supabase = createClient();

  // Get master key from environment variable
  const masterKey = process.env.API_ENCRYPTION_KEY;

  if (!masterKey) {
    console.error(
      '[Get Dify Config] ERROR: API_ENCRYPTION_KEY environment variable is not set. Cannot decrypt API key.'
    );
    // Return null because decryption is not possible without master key
    return null;
  }

  // Refactor: support multiple providers, search for app instance among all active providers
  // No longer hardcode to only search Dify provider
  // 1. Directly search for the corresponding service instance (including provider info)
  const { data: instance, error: instanceError } = await supabase
    .from('service_instances')
    .select(
      `
      *,
      providers!inner(
        id,
        name,
        base_url,
        is_active
      )
    `
    )
    .eq('instance_id', appId)
    .eq('providers.is_active', true)
    .single();

  let serviceInstance = instance;
  let provider = instance?.providers;

  // If the specified instance is not found, try to use the default provider's default instance as fallback
  if (instanceError || !serviceInstance) {
    console.log(
      `[Get App Config] No service instance found for instance_id "${appId}", trying default provider's default instance`
    );

    // Get default provider
    const { data: defaultProvider, error: defaultProviderError } =
      await supabase
        .from('providers')
        .select('id, name, base_url')
        .eq('is_default', true)
        .eq('is_active', true)
        .single();

    if (defaultProviderError || !defaultProvider) {
      console.error(
        `[Get App Config] No default provider found, appId: ${appId}`
      );
      return null;
    }

    // Get default instance for default provider
    const { data: defaultInstance, error: defaultInstanceError } =
      await supabase
        .from('service_instances')
        .select('*')
        .eq('provider_id', defaultProvider.id)
        .eq('is_default', true)
        .single();

    if (defaultInstanceError || !defaultInstance) {
      console.error(
        `[Get App Config] No default service instance found for default provider, appId: ${appId}`
      );
      return null;
    }

    serviceInstance = defaultInstance;
    provider = defaultProvider;
    console.log(
      `[Get App Config] Using default provider "${provider.name}" default instance: ${defaultInstance.instance_id} (original request: ${appId})`
    );
  } else {
    console.log(
      `[Get App Config] Found app instance: ${appId}, provider: ${provider.name}`
    );
  }

  if (!serviceInstance || !provider) {
    console.error(`No service instance or provider found for app "${appId}"`);
    return null;
  }

  const instanceId = serviceInstance.id;

  if (!instanceId) {
    console.error(`No valid instance ID for Dify app "${appId}"`);
    return null;
  }

  // 4. Get API key
  const { data: apiKey, error: apiKeyError } = await supabase
    .from('api_keys')
    .select('*')
    .eq('service_instance_id', instanceId)
    .eq('is_default', true)
    .single();

  if (apiKeyError || !apiKey) {
    console.error(`No API key found for app "${appId}"`);
    return null;
  }

  // Check if API key is empty
  if (!apiKey.key_value) {
    console.error('API key value is empty');
    return null;
  }

  try {
    let decryptedKey: string;

    // If the key is not in encrypted format, use it directly
    if (!apiKey.key_value.includes(':')) {
      decryptedKey = apiKey.key_value;
    } else {
      try {
        // Use masterKey from environment variable to decrypt
        decryptedKey = decryptApiKey(apiKey.key_value, masterKey);
      } catch (decryptError) {
        // If decryption fails, do not use test key, just log error and return null
        console.error(
          `[Get Dify Config] Failed to decrypt API Key for appID '${appId}':`,
          decryptError
        );
        console.error(
          '[Get Dify Config] The master key used may be inconsistent with the one used for encryption (check API_ENCRYPTION_KEY env), or the encrypted data is corrupted.'
        );
        return null;
      }
    }

    // 5. Build config
    const config = {
      apiKey: decryptedKey,
      apiUrl: provider.base_url,
      appId: serviceInstance.instance_id,
      displayName: serviceInstance.display_name || serviceInstance.instance_id,
      description: serviceInstance.description,
      appType: serviceInstance.config?.app_metadata?.dify_apptype,
    };

    return config;
  } catch (error) {
    console.error('Failed to decrypt API key:', error);
    return null;
  }
}

// Functions related to environment variable config fetching have been removed.
// Now we only fetch config from database, no longer use environment variables.
