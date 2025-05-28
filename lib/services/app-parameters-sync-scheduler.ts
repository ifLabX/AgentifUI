/**
 * 应用参数同步调度服务
 * 
 * 🎯 功能：
 * 1. 定期自动同步Dify应用参数到数据库
 * 2. 支持手动触发同步
 * 3. 错误重试和状态监控
 * 4. 可配置的同步间隔和策略
 */

import { appParametersService } from './app-parameters-service';
import { getAppInstancesForSync } from '@lib/db';
import type { Result } from '@lib/types/result';
import { success, failure } from '@lib/types/result';

// --- BEGIN COMMENT ---
// 导出类型定义供外部使用
// --- END COMMENT ---
export interface SyncConfig {
  interval: number; // 同步间隔（分钟）
  maxRetries: number; // 最大重试次数
  retryDelay: number; // 重试延迟（毫秒）
  batchSize: number; // 批次大小
  enabled: boolean; // 是否启用
}

export interface SchedulerStats {
  lastSyncTime?: Date;
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  currentlyRunning: boolean;
  nextSyncTime?: Date;
}

const DEFAULT_CONFIG: SyncConfig = {
  interval: 60, // 每小时同步一次
  maxRetries: 3,
  retryDelay: 30 * 1000, // 30秒
  batchSize: 10, // 每批次处理10个应用
  enabled: false // 默认关闭，需要手动启用
};

class AppParametersSyncScheduler {
  private config: SyncConfig = { ...DEFAULT_CONFIG };
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private stats: SchedulerStats = {
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    currentlyRunning: false
  };

  /**
   * 配置同步调度器
   */
  configure(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[SyncScheduler] 配置已更新:', this.config);
    
    // 如果调度器正在运行且配置发生变化，重启调度器
    if (this.intervalId && config.interval) {
      this.stop();
      if (this.config.enabled) {
        this.start();
      }
    }
  }

  /**
   * 启动定期同步
   */
  start(): Result<void> {
    if (!this.config.enabled) {
      console.log('[SyncScheduler] 同步调度器已禁用');
      return failure(new Error('同步调度器已禁用'));
    }

    if (this.intervalId) {
      console.log('[SyncScheduler] 同步调度器已在运行中');
      return success(undefined);
    }

    console.log(`[SyncScheduler] 启动定期同步，间隔 ${this.config.interval} 分钟`);
    
    // 立即执行一次同步
    this.performSync();
    
    // 设置定期执行
    this.intervalId = setInterval(() => {
      this.performSync();
    }, this.config.interval * 60 * 1000);

    // 更新下次同步时间
    this.updateNextSyncTime();

    return success(undefined);
  }

  /**
   * 停止定期同步
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[SyncScheduler] 定期同步已停止');
    }
  }

  /**
   * 手动触发同步
   */
  async triggerSync(): Promise<Result<void>> {
    if (this.isRunning) {
      return failure(new Error('同步正在进行中，请稍后再试'));
    }

    return await this.performSync();
  }

  /**
   * 执行同步操作
   */
  private async performSync(): Promise<Result<void>> {
    if (this.isRunning) {
      console.log('[SyncScheduler] 同步已在进行中，跳过本次执行');
      return success(undefined);
    }

    this.isRunning = true;
    this.stats.currentlyRunning = true;
    this.stats.lastSyncTime = new Date();

    console.log('[SyncScheduler] 开始执行定期同步');

    try {
      // 获取需要同步的应用实例
      const instancesResult = await getAppInstancesForSync(this.config.interval);
      if (!instancesResult.success) {
        throw instancesResult.error;
      }

      const instances = instancesResult.data;
      console.log(`[SyncScheduler] 发现 ${instances.length} 个需要同步的应用`);

      if (instances.length === 0) {
        this.stats.successfulSyncs++;
        return success(undefined);
      }

      // 分批处理
      const instanceIds = instances.map(instance => instance.instance_id);
      const batches = this.createBatches(instanceIds, this.config.batchSize);

      let totalSuccessful = 0;
      let totalFailed = 0;

      for (const [batchIndex, batch] of batches.entries()) {
        console.log(`[SyncScheduler] 处理批次 ${batchIndex + 1}/${batches.length} (${batch.length} 个应用)`);
        
        const batchResult = await appParametersService.batchSync(batch);
        
        if (batchResult.success) {
          const successCount = batchResult.data.filter(r => r.success).length;
          const failCount = batchResult.data.filter(r => !r.success).length;
          
          totalSuccessful += successCount;
          totalFailed += failCount;
          
          console.log(`[SyncScheduler] 批次 ${batchIndex + 1} 完成: ${successCount} 成功, ${failCount} 失败`);
        } else {
          console.error(`[SyncScheduler] 批次 ${batchIndex + 1} 失败:`, batchResult.error);
          totalFailed += batch.length;
        }

        // 批次间的短暂延迟
        if (batchIndex < batches.length - 1) {
          await this.delay(1000);
        }
      }

      console.log(`[SyncScheduler] 同步完成: ${totalSuccessful} 成功, ${totalFailed} 失败`);
      
      this.stats.totalSyncs++;
      if (totalFailed === 0) {
        this.stats.successfulSyncs++;
      } else {
        this.stats.failedSyncs++;
      }

      return success(undefined);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步失败';
      console.error('[SyncScheduler] 同步失败:', error);
      
      this.stats.totalSyncs++;
      this.stats.failedSyncs++;
      
      return failure(new Error(errorMessage));
    } finally {
      this.isRunning = false;
      this.stats.currentlyRunning = false;
      this.updateNextSyncTime();
    }
  }

  /**
   * 创建批次
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * 延迟执行
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 更新下次同步时间
   */
  private updateNextSyncTime(): void {
    if (this.intervalId && this.config.enabled) {
      this.stats.nextSyncTime = new Date(Date.now() + this.config.interval * 60 * 1000);
    } else {
      this.stats.nextSyncTime = undefined;
    }
  }

  /**
   * 获取调度器状态
   */
  getStatus(): {
    config: SyncConfig;
    stats: SchedulerStats;
    isActive: boolean;
  } {
    return {
      config: { ...this.config },
      stats: { ...this.stats },
      isActive: !!this.intervalId
    };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      currentlyRunning: this.stats.currentlyRunning,
      lastSyncTime: this.stats.lastSyncTime,
      nextSyncTime: this.stats.nextSyncTime
    };
    console.log('[SyncScheduler] 统计信息已重置');
  }

  /**
   * 销毁调度器
   */
  destroy(): void {
    this.stop();
    this.resetStats();
    console.log('[SyncScheduler] 调度器已销毁');
  }
}

// 导出单例实例
export const syncScheduler = new AppParametersSyncScheduler();