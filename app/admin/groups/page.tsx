'use client';

import { CreateGroupModal } from '@components/admin/groups/create-group-modal';
import { GroupsHeader } from '@components/admin/groups/groups-header';
import { GroupsList } from '@components/admin/groups/groups-list';
import { GroupsSearch } from '@components/admin/groups/groups-search';
import { GroupsStatsCards } from '@components/admin/groups/groups-stats-cards';
import { useGroupManagementStore } from '@lib/stores/group-management-store';
import { toast } from 'sonner';

import React, { useEffect, useState } from 'react';

export default function GroupsPage() {
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

  // load data when page initializes
  useEffect(() => {
    loadGroups();
    loadStats();
  }, [loadGroups, loadStats]);

  // handle error prompt
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // filter groups
  const filteredGroups = groups.filter(
    group =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.description &&
        group.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-7xl p-6">
        {/* page title and action bar */}
        <GroupsHeader onCreateGroup={() => setShowCreateModal(true)} />

        {/* stats cards */}
        <GroupsStatsCards stats={stats} isLoading={loading.stats} />

        {/* search filter */}
        <GroupsSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />

        {/* groups list */}
        <GroupsList groups={filteredGroups} isLoading={loading.groups} />

        {/* create group modal */}
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
