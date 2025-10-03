/**
 * Database query functions related to service providers.
 *
 * This file contains all database operations related to the providers table.
 * Updated to use unified data service and Result type.
 */
import { cacheService } from '@lib/services/db/cache-service';
import { dataService } from '@lib/services/db/data-service';
import { SubscriptionKeys } from '@lib/services/db/realtime-service';
import { Result, success } from '@lib/types/result';

import { Provider } from '../types/database';

/**
 * Get all service providers (optimized version)
 * @returns Result containing the list of providers
 */
export async function getAllProviders(): Promise<Result<Provider[]>> {
  return dataService.findMany<Provider>(
    'providers',
    {},
    { column: 'name', ascending: true },
    undefined,
    {
      cache: true,
      cacheTTL: 15 * 60 * 1000, // 15 minutes cache, provider info changes infrequently
      subscribe: true,
      subscriptionKey: SubscriptionKeys.providers(),
      onUpdate: () => {
        // Clear cache when provider info is updated
        cacheService.deletePattern('providers:*');
      },
    }
  );
}

/**
 * Get all active service providers (optimized version)
 * @returns Result containing the list of active providers
 */
export async function getActiveProviders(): Promise<Result<Provider[]>> {
  return dataService.findMany<Provider>(
    'providers',
    { is_active: true },
    { column: 'name', ascending: true },
    undefined,
    {
      cache: true,
      cacheTTL: 15 * 60 * 1000, // 15 minutes cache, provider info changes infrequently
      subscribe: true,
      subscriptionKey: SubscriptionKeys.providers(),
      onUpdate: () => {
        // Clear cache when provider info is updated
        cacheService.deletePattern('providers:*');
      },
    }
  );
}

/**
 * Get service provider by ID (optimized version)
 * @param id Provider ID
 * @returns Result containing the provider object, or null if not found
 */
export async function getProviderById(
  id: string
): Promise<Result<Provider | null>> {
  return dataService.findOne<Provider>(
    'providers',
    { id },
    {
      cache: true,
      cacheTTL: 10 * 60 * 1000, // 10 minutes cache
    }
  );
}

/**
 * Get service provider by name (optimized version)
 * @param name Provider name
 * @returns Result containing the provider object, or null if not found
 */
export async function getProviderByName(
  name: string
): Promise<Result<Provider | null>> {
  return dataService.findOne<Provider>(
    'providers',
    { name },
    {
      cache: true,
      cacheTTL: 10 * 60 * 1000, // 10 minutes cache
    }
  );
}

/**
 * Get default service provider (optimized version)
 * @returns Result containing the default provider object, or null if not found
 */
export async function getDefaultProvider(): Promise<Result<Provider | null>> {
  return dataService.findOne<Provider>(
    'providers',
    {
      is_default: true,
      is_active: true,
    },
    {
      cache: true,
      cacheTTL: 10 * 60 * 1000, // 10 minutes cache
    }
  );
}

/**
 * Create a new service provider (optimized version)
 * @param provider Provider object
 * @returns Result containing the created provider object, or error if creation failed
 */
export async function createProvider(
  provider: Omit<Provider, 'id' | 'created_at' | 'updated_at'>
): Promise<Result<Provider>> {
  const result = await dataService.create<Provider>('providers', provider);

  // Clear related cache
  if (result.success) {
    cacheService.deletePattern('providers:*');
  }

  return result;
}

/**
 * Update a service provider (optimized version)
 * @param id Provider ID
 * @param updates Fields to update
 * @returns Result containing the updated provider object, or error if update failed
 */
export async function updateProvider(
  id: string,
  updates: Partial<Omit<Provider, 'id' | 'created_at' | 'updated_at'>>
): Promise<Result<Provider>> {
  const result = await dataService.update<Provider>('providers', id, updates);

  // Clear related cache
  if (result.success) {
    cacheService.deletePattern('providers:*');
  }

  return result;
}

/**
 * Delete a service provider (optimized version)
 * @param id Provider ID
 * @returns Result indicating whether deletion was successful
 */
export async function deleteProvider(id: string): Promise<Result<boolean>> {
  const result = await dataService.delete('providers', id);

  if (result.success) {
    // Clear related cache
    cacheService.deletePattern('providers:*');
    return success(true);
  } else {
    return success(false);
  }
}

// Compatibility functions to maintain compatibility with existing code
// These functions will gradually migrate to use the Result type

/**
 * Get all active service providers (legacy version)
 * @deprecated Please use the new version and handle the Result type
 */
export async function getActiveProvidersLegacy(): Promise<Provider[]> {
  const result = await getActiveProviders();
  return result.success ? result.data : [];
}

/**
 * Get service provider by ID (legacy version)
 * @deprecated Please use the new version and handle the Result type
 */
export async function getProviderByIdLegacy(
  id: string
): Promise<Provider | null> {
  const result = await getProviderById(id);
  return result.success ? result.data : null;
}

/**
 * Get service provider by name (legacy version)
 * @deprecated Please use the new version and handle the Result type
 */
export async function getProviderByNameLegacy(
  name: string
): Promise<Provider | null> {
  const result = await getProviderByName(name);
  return result.success ? result.data : null;
}

/**
 * Get default service provider (legacy version)
 * @deprecated Please use the new version and handle the Result type
 */
export async function getDefaultProviderLegacy(): Promise<Provider | null> {
  const result = await getDefaultProvider();
  return result.success ? result.data : null;
}

/**
 * Create a new service provider (legacy version)
 * @deprecated Please use the new version and handle the Result type
 */
export async function createProviderLegacy(
  provider: Omit<Provider, 'id' | 'created_at' | 'updated_at'>
): Promise<Provider | null> {
  const result = await createProvider(provider);
  return result.success ? result.data : null;
}

/**
 * Update a service provider (legacy version)
 * @deprecated Please use the new version and handle the Result type
 */
export async function updateProviderLegacy(
  id: string,
  updates: Partial<Omit<Provider, 'id' | 'created_at' | 'updated_at'>>
): Promise<Provider | null> {
  const result = await updateProvider(id, updates);
  return result.success ? result.data : null;
}

/**
 * Delete a service provider (legacy version)
 * @deprecated Please use the new version and handle the Result type
 */
export async function deleteProviderLegacy(id: string): Promise<boolean> {
  const result = await deleteProvider(id);
  return result.success ? result.data : false;
}
