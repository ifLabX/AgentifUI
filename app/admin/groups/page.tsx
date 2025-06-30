'use client';

import { CreateGroupModal } from '@components/admin/groups/create-group-modal';
import { GroupsHeader } from '@components/admin/groups/groups-header';
import { GroupsList } from '@components/admin/groups/groups-list';
import { GroupsSearch } from '@components/admin/groups/groups-search';
import { GroupsStatsCards } from '@components/admin/groups/groups-stats-cards';
import { useTheme } from '@lib/hooks/use-theme';
import { useGroupManagementStore } from '@lib/stores/group-management-store';
import { cn } from '@lib/utils';
import { toast } from 'react-hot-toast';

import React, { useEffect, useState } from 'react';

export default function GroupsPage() {
  const { isDark } = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    groups,
    stats,
    loading,
    error,
    searchTerm,
    loadGroups,
    loadStats,
    setSearchTerm,
    clearError,
  } = useGroupManagementStore();

  // 页面初始化时加载数据
  useEffect(() => {
    loadGroups();
    loadStats();
  }, [loadGroups, loadStats]);

  // 处理错误提示
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // 过滤群组
  const filteredGroups = groups.filter(
    group =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.description &&
        group.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div
      className={cn(
        'min-h-screen',
        isDark
          ? 'bg-gradient-to-br from-stone-950 via-stone-900 to-stone-800'
          : 'bg-gradient-to-br from-stone-50 via-white to-stone-100'
      )}
    >
      <div className="mx-auto max-w-7xl p-6">
        {/* 页面标题和操作栏 */}
        <GroupsHeader onCreateGroup={() => setShowCreateModal(true)} />

        {/* 统计卡片 */}
        <GroupsStatsCards stats={stats} isLoading={loading.stats} />

        {/* 搜索筛选 */}
        <GroupsSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />

        {/* 群组列表 */}
        <GroupsList groups={filteredGroups} isLoading={loading.groups} />

        {/* 创建群组模态框 */}
        {showCreateModal && (
          <CreateGroupModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </div>
    </div>
  );
}
