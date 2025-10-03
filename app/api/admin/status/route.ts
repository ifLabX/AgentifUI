import { getActiveProviders, getServiceInstancesByProvider } from '@lib/db';

import { NextResponse } from 'next/server';

/**
 * Get admin backend status information
 */
export async function GET() {
  try {
    // check if there are active service providers
    const providersResult = await getActiveProviders();

    if (!providersResult.success) {
      return NextResponse.json({
        hasActiveProviders: false,
        hasActiveInstances: false,
        error: 'Cannot get provider information',
      });
    }

    const providers = providersResult.data;
    let hasActiveInstances = false;

    // check if there are configured service instances
    if (providers.length > 0) {
      for (const provider of providers) {
        const instancesResult = await getServiceInstancesByProvider(
          provider.id
        );
        if (instancesResult.success && instancesResult.data.length > 0) {
          hasActiveInstances = true;
          break;
        }
      }
    }

    return NextResponse.json({
      hasActiveProviders: providers.length > 0,
      hasActiveInstances,
      providersCount: providers.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to get admin status:', error);
    return NextResponse.json(
      {
        error: 'Failed to get status information',
        hasActiveProviders: false,
        hasActiveInstances: false,
      },
      { status: 500 }
    );
  }
}
