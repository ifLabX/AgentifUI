/**
 * Unified real-time subscription management service.
 *
 * Manages Supabase real-time subscriptions to avoid duplicate subscriptions and memory leaks.
 * Provides subscribe, unsubscribe, and management functions.
 */
import { createClient } from '@lib/supabase/client';

import type { RealtimeChannel } from '@supabase/supabase-js';

export interface SubscriptionConfig {
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema: string;
  table: string;
  filter?: string;
}

interface ManagedSubscription {
  channel: RealtimeChannel;
  handlers: Set<(payload: any) => void>;
  config: SubscriptionConfig;
  createdAt: number;
}

export class RealtimeService {
  private static instance: RealtimeService;
  private supabase = createClient();
  private subscriptions = new Map<string, ManagedSubscription>();

  private constructor() {}

  /**
   * Get the singleton instance of the real-time service.
   */
  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  /**
   * Subscribe to database changes.
   * @param key Subscription identifier key
   * @param config Subscription configuration
   * @param handler Change handler function
   * @returns Unsubscribe function
   */
  subscribe(
    key: string,
    config: SubscriptionConfig,
    handler: (payload: any) => void
  ): () => void {
    let subscription = this.subscriptions.get(key);

    if (subscription) {
      // If the subscription already exists, just add the new handler
      subscription.handlers.add(handler);
      console.log(
        `[Realtime Subscription] Added handler to existing subscription: ${key}`
      );
    } else {
      // Create a new subscription
      // Fix duplicate subscription issue: use the subscription key as the channel name to ensure each subscription has a unique channel
      const channelKey = `channel-${key}`;
      const channel = this.supabase.channel(channelKey);

      // Create a composite handler to call all registered handlers
      const compositeHandler = (payload: any) => {
        const sub = this.subscriptions.get(key);
        if (sub) {
          sub.handlers.forEach(h => {
            try {
              h(payload);
            } catch (error) {
              console.error(
                `[Realtime Subscription] Handler execution error:`,
                error
              );
            }
          });
        }
      };

      // Configure subscription
      const subscriptionConfig = {
        event: config.event,
        schema: config.schema,
        table: config.table,
        ...(config.filter && { filter: config.filter }),
      };

      // Configure subscription
      channel.on(
        'postgres_changes' as any, // Temporary type cast to avoid TypeScript type error
        subscriptionConfig,
        compositeHandler
      );

      // Subscribe to the channel
      channel.subscribe(status => {
        console.log(`[Realtime Subscription] ${key} status changed: ${status}`);
      });

      subscription = {
        channel,
        handlers: new Set([handler]),
        config,
        createdAt: Date.now(),
      };

      this.subscriptions.set(key, subscription);
      console.log(`[Realtime Subscription] Created new subscription: ${key}`);
    }

    // Return the unsubscribe function
    return () => {
      this.unsubscribeHandler(key, handler);
    };
  }

  /**
   * Remove a specific handler from a subscription.
   */
  private unsubscribeHandler(
    key: string,
    handler: (payload: any) => void
  ): void {
    const subscription = this.subscriptions.get(key);
    if (!subscription) return;

    subscription.handlers.delete(handler);

    // If there are no handlers left, remove the subscription completely
    if (subscription.handlers.size === 0) {
      this.unsubscribe(key);
    }
  }

  /**
   * Completely unsubscribe from a subscription.
   */
  unsubscribe(key: string): void {
    const subscription = this.subscriptions.get(key);
    if (!subscription) return;

    try {
      this.supabase.removeChannel(subscription.channel);
      this.subscriptions.delete(key);
      console.log(`[Realtime Subscription] Unsubscribed: ${key}`);
    } catch (error) {
      console.error(
        `[Realtime Subscription] Failed to unsubscribe: ${key}`,
        error
      );
    }
  }

  /**
   * Unsubscribe from all subscriptions.
   */
  unsubscribeAll(): void {
    const keys = Array.from(this.subscriptions.keys());
    keys.forEach(key => this.unsubscribe(key));
    console.log(
      `[Realtime Subscription] Unsubscribed all, total ${keys.length}`
    );
  }

  /**
   * Get subscription statistics.
   */
  getStats(): {
    total: number;
    byTable: Record<string, number>;
    byEvent: Record<string, number>;
    oldestSubscription?: { key: string; age: number };
  } {
    const stats = {
      total: this.subscriptions.size,
      byTable: {} as Record<string, number>,
      byEvent: {} as Record<string, number>,
      oldestSubscription: undefined as { key: string; age: number } | undefined,
    };

    let oldestTimestamp = Date.now();
    let oldestKey = '';

    for (const [key, subscription] of this.subscriptions.entries()) {
      // Count by table
      const table = subscription.config.table;
      stats.byTable[table] = (stats.byTable[table] || 0) + 1;

      // Count by event
      const event = subscription.config.event;
      stats.byEvent[event] = (stats.byEvent[event] || 0) + 1;

      // Find the oldest subscription
      if (subscription.createdAt < oldestTimestamp) {
        oldestTimestamp = subscription.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      stats.oldestSubscription = {
        key: oldestKey,
        age: Date.now() - oldestTimestamp,
      };
    }

    return stats;
  }

  /**
   * List all active subscriptions.
   */
  listSubscriptions(): Array<{
    key: string;
    table: string;
    event: string;
    filter?: string;
    handlerCount: number;
    age: number;
  }> {
    return Array.from(this.subscriptions.entries()).map(
      ([key, subscription]) => ({
        key,
        table: subscription.config.table,
        event: subscription.config.event,
        filter: subscription.config.filter,
        handlerCount: subscription.handlers.size,
        age: Date.now() - subscription.createdAt,
      })
    );
  }

  /**
   * Destroy the service and clean up all subscriptions.
   */
  destroy(): void {
    this.unsubscribeAll();
    console.log('[Realtime Subscription] Service destroyed');
  }
}

// Export singleton instance
export const realtimeService = RealtimeService.getInstance();

// Common subscription key generators
export const SubscriptionKeys = {
  // Fix duplicate subscription issue: provide differentiated subscription keys for different hook usages
  sidebarConversations: (userId: string) => `sidebar-conversations:${userId}`,
  allConversations: (userId: string) => `all-conversations:${userId}`,

  // Keep backward compatibility, existing code can continue to use
  userConversations: (userId: string) => `user-conversations:${userId}`,

  conversationMessages: (conversationId: string) =>
    `conversation-messages:${conversationId}`,
  userProfile: (userId: string) => `user-profile:${userId}`,
  providers: () => 'providers',
  serviceInstances: () => 'service-instances',
  apiKeys: () => 'api-keys',
};

// Common subscription configs
export const SubscriptionConfigs = {
  conversations: (userId?: string): SubscriptionConfig => ({
    event: '*',
    schema: 'public',
    table: 'conversations',
    ...(userId && { filter: `user_id=eq.${userId}` }),
  }),

  messages: (conversationId?: string): SubscriptionConfig => ({
    event: '*',
    schema: 'public',
    table: 'messages',
    ...(conversationId && { filter: `conversation_id=eq.${conversationId}` }),
  }),

  profiles: (userId?: string): SubscriptionConfig => ({
    event: 'UPDATE',
    schema: 'public',
    table: 'profiles',
    ...(userId && { filter: `id=eq.${userId}` }),
  }),

  providers: (): SubscriptionConfig => ({
    event: '*',
    schema: 'public',
    table: 'providers',
  }),

  serviceInstances: (): SubscriptionConfig => ({
    event: '*',
    schema: 'public',
    table: 'service_instances',
  }),
};
