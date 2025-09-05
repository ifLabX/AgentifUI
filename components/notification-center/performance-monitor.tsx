'use client';

import { cn } from '@lib/utils';
import { BarChart3, Database, Zap } from 'lucide-react';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import {
  useEnhancedNotificationCenter,
  useNotificationPerformance,
} from '../../lib/stores/enhanced-notification-center-store';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
// Note: Collapsible component not available, using details element instead
import { Switch } from '../ui/switch';

interface NotificationPerformanceMonitorProps {
  className?: string;
  showDeveloperInfo?: boolean;
}

/**
 * Development/debugging component for monitoring notification center performance
 *
 * Features:
 * - Real-time performance metrics
 * - Cache statistics and controls
 * - Request/response monitoring
 * - Memory usage tracking
 * - Toggle cache on/off for testing
 */
export function NotificationPerformanceMonitor({
  className,
  showDeveloperInfo = false,
}: NotificationPerformanceMonitorProps) {
  const t = useTranslations('components.notificationCenter.performance');
  const [isExpanded, setIsExpanded] = useState(false);

  // Get performance data and controls
  const performance = useNotificationPerformance();
  const {
    cacheEnabled,
    toggleCache,
    clearCache,
    getCacheStats,
    pagination,
    metrics,
  } = useEnhancedNotificationCenter();

  const cacheStats = getCacheStats();

  // Helper function for formatting bytes (currently unused but kept for future use)
  // const formatBytes = (bytes: number) => {
  //   if (bytes === 0) return '0 B';
  //   const k = 1024;
  //   const sizes = ['B', 'KB', 'MB'];
  //   const i = Math.floor(Math.log(bytes) / Math.log(k));
  //   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  // };

  const formatTime = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return `${Math.round(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
    return `${Math.round(diff / 3600000)}h ago`;
  };

  if (!showDeveloperInfo) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      <details open={isExpanded}>
        <summary
          className="w-full cursor-pointer"
          onClick={e => {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }}
        >
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance Monitor
            </span>
            <Badge
              variant={performance.hitRate === '0%' ? 'destructive' : 'default'}
            >
              {performance.hitRate} hit rate
            </Badge>
          </Button>
        </summary>

        {isExpanded && (
          <div className="space-y-4 pt-4">
            {/* Cache Statistics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Database className="h-4 w-4" />
                  Cache Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">
                      {t('cache.hits')}
                    </p>
                    <p className="font-mono text-sm">{metrics.cacheHits}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">
                      {t('cache.misses')}
                    </p>
                    <p className="font-mono text-sm">{metrics.cacheMisses}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">
                      {t('cache.hitRate')}
                    </p>
                    <p className="font-mono text-sm">{performance.hitRate}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">
                      {t('cache.size')}
                    </p>
                    <p className="font-mono text-sm">
                      {cacheStats.size}/{cacheStats.maxSize}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">
                    {t('cache.memory')}
                  </p>
                  <p className="font-mono text-sm">{cacheStats.memoryUsage}</p>
                </div>

                {/* Cache Controls */}
                <div className="flex items-center justify-between border-t pt-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={cacheEnabled}
                      onCheckedChange={toggleCache}
                      className="scale-75"
                    />
                    <span className="text-xs">
                      Cache{' '}
                      {cacheEnabled ? t('cache.enabled') : t('cache.disabled')}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCache}
                    className="h-7 px-2 text-xs"
                  >
                    Clear Cache
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Request Metrics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4" />
                  Request Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">
                      {t('metrics.totalRequests')}
                    </p>
                    <p className="font-mono text-sm">{metrics.totalRequests}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">
                      {t('metrics.lastFetch')}
                    </p>
                    <p className="font-mono text-sm">
                      {formatTime(metrics.lastFetchTime)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">
                      {t('metrics.itemsPerPage')}
                    </p>
                    <p className="font-mono text-sm">
                      {pagination.itemsPerPage}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">
                      Current Page
                    </p>
                    <p className="font-mono text-sm">
                      {pagination.currentPage - 1}
                      {pagination.total &&
                        ` of ${Math.ceil(pagination.total / pagination.itemsPerPage)}`}
                    </p>
                  </div>
                </div>

                {pagination.total && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">Total Items</p>
                    <p className="font-mono text-sm">{pagination.total}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 border-t pt-3">
                  <Badge
                    variant={pagination.hasMore ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {pagination.hasMore ? 'Has More' : 'End Reached'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Development Info */}
            <Card className="border-dashed">
              <CardContent className="pt-4">
                <details className="space-y-2">
                  <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs">
                    Debug Information
                  </summary>
                  <pre className="bg-muted overflow-x-auto rounded p-2 text-xs">
                    {JSON.stringify(
                      {
                        cache: {
                          enabled: cacheEnabled,
                          stats: cacheStats,
                          hitRate: performance.hitRate,
                        },
                        pagination,
                        metrics,
                      },
                      null,
                      2
                    )}
                  </pre>
                </details>
              </CardContent>
            </Card>
          </div>
        )}
      </details>
    </div>
  );
}

/**
 * Simplified performance indicator for production use
 */
interface PerformanceIndicatorProps {
  className?: string;
}

export function NotificationPerformanceIndicator({
  className,
}: PerformanceIndicatorProps) {
  const performance = useNotificationPerformance();
  const { cacheEnabled } = useEnhancedNotificationCenter();

  if (!cacheEnabled) {
    return null;
  }

  const hitRateNumber = parseFloat(performance.hitRate.replace('%', ''));
  const indicatorColor =
    hitRateNumber >= 70
      ? 'success'
      : hitRateNumber >= 40
        ? 'warning'
        : 'destructive';

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div
        className={cn(
          'h-2 w-2 rounded-full',
          indicatorColor === 'success' && 'bg-green-500',
          indicatorColor === 'warning' && 'bg-yellow-500',
          indicatorColor === 'destructive' && 'bg-red-500'
        )}
      />
      <span className="text-muted-foreground text-xs">
        {performance.hitRate}
      </span>
    </div>
  );
}

export type { NotificationPerformanceMonitorProps, PerformanceIndicatorProps };
