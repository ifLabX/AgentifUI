'use client';

import { ConfirmDialog } from '@components/ui';
import type { Group } from '@lib/db/group-permissions';
import {
  DateFormatPresets,
  useDateFormatter,
} from '@lib/hooks/use-date-formatter';
import { useTheme } from '@lib/hooks/use-theme';
import { useGroupManagementStore } from '@lib/stores/group-management-store';
import { cn } from '@lib/utils';
import {
  Building2,
  Calendar,
  Edit,
  Eye,
  MoreHorizontal,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { EditGroupModal } from './edit-group-modal';
import { GroupMembersModal } from './group-members-modal';

interface GroupsListProps {
  groups: Group[];
  isLoading: boolean;
}

export function GroupsList({ groups, isLoading }: GroupsListProps) {
  const { isDark } = useTheme();
  const { deleteGroup } = useGroupManagementStore();
  const t = useTranslations('pages.admin.groups');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [viewingMembersGroup, setViewingMembersGroup] = useState<Group | null>(
    null
  );
  const { formatDate } = useDateFormatter();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteGroup = (group: Group) => {
    setGroupToDelete(group);
    setShowDeleteDialog(true);
  };

  const handleConfirmDeleteGroup = async () => {
    if (!groupToDelete) return;

    setIsDeleting(true);
    const success = await deleteGroup(groupToDelete.id);
    if (success) {
      toast.success(t('messages.deleteSuccess', { name: groupToDelete.name }));
      setShowDeleteDialog(false);
      setGroupToDelete(null);
    }
    setIsDeleting(false);
  };

  const handleViewMembers = (group: Group) => {
    setViewingMembersGroup(group);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'rounded-xl border p-6 shadow-lg backdrop-blur-sm',
              isDark
                ? 'border-stone-700/50 bg-stone-800/60'
                : 'border-stone-200/50 bg-white/80'
            )}
          >
            <div className="animate-pulse">
              <div
                className={cn(
                  'mb-4 h-6 w-3/4 rounded',
                  isDark ? 'bg-stone-700' : 'bg-stone-200'
                )}
              />
              <div
                className={cn(
                  'mb-3 h-4 w-full rounded',
                  isDark ? 'bg-stone-700' : 'bg-stone-200'
                )}
              />
              <div
                className={cn(
                  'h-4 w-1/2 rounded',
                  isDark ? 'bg-stone-700' : 'bg-stone-200'
                )}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl border p-12 text-center shadow-lg backdrop-blur-sm',
          isDark
            ? 'border-stone-700/50 bg-stone-800/60'
            : 'border-stone-200/50 bg-white/80'
        )}
      >
        <Building2
          className={cn(
            'mx-auto mb-4 h-12 w-12',
            isDark ? 'text-stone-400' : 'text-stone-500'
          )}
        />
        <h3
          className={cn(
            'mb-2 font-serif text-lg font-semibold',
            isDark ? 'text-stone-200' : 'text-stone-800'
          )}
        >
          {t('list.noGroups')}
        </h3>
        <p
          className={cn(
            'font-serif text-sm',
            isDark ? 'text-stone-400' : 'text-stone-600'
          )}
        >
          {t('list.noGroupsHint')}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map(group => (
          <div
            key={group.id}
            className={cn(
              'group relative rounded-xl border p-6 transition-all duration-200 hover:shadow-lg',
              isDark
                ? 'hover:bg-stone-750 border-stone-700 bg-stone-800 hover:border-stone-600'
                : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-stone-200/50'
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        isDark ? 'bg-stone-700' : 'bg-stone-100'
                      )}
                    >
                      <Building2
                        className={cn(
                          'h-5 w-5',
                          isDark ? 'text-stone-300' : 'text-stone-600'
                        )}
                      />
                    </div>
                    <div>
                      <h3
                        className={cn(
                          'font-serif text-lg font-semibold',
                          isDark ? 'text-stone-100' : 'text-stone-900'
                        )}
                      >
                        {group.name}
                      </h3>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() =>
                        setShowDropdown(
                          showDropdown === group.id ? null : group.id
                        )
                      }
                      className={cn(
                        'rounded-lg p-2 opacity-0 transition-all duration-200 group-hover:opacity-100',
                        isDark
                          ? 'text-stone-400 hover:bg-stone-700/50 hover:text-stone-300'
                          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
                      )}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {showDropdown === group.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowDropdown(null)}
                        />
                        <div
                          className={cn(
                            'absolute top-full right-0 z-20 mt-1 w-48 rounded-lg border shadow-lg',
                            isDark
                              ? 'border-stone-600 bg-stone-700'
                              : 'border-stone-200 bg-white'
                          )}
                        >
                          <button
                            onClick={() => {
                              handleViewMembers(group);
                              setShowDropdown(null);
                            }}
                            className={cn(
                              'flex w-full items-center gap-2 px-3 py-2 text-left font-serif text-sm transition-colors',
                              isDark
                                ? 'text-stone-300 hover:bg-stone-600'
                                : 'text-stone-700 hover:bg-stone-50'
                            )}
                          >
                            <Eye className="h-4 w-4" />
                            {t('list.actions.manageMembers')}
                          </button>
                          <button
                            onClick={() => {
                              setEditingGroup(group);
                              setShowDropdown(null);
                            }}
                            className={cn(
                              'flex w-full items-center gap-2 px-3 py-2 text-left font-serif text-sm transition-colors',
                              isDark
                                ? 'text-stone-300 hover:bg-stone-600'
                                : 'text-stone-700 hover:bg-stone-50'
                            )}
                          >
                            <Edit className="h-4 w-4" />
                            {t('list.actions.editGroup')}
                          </button>
                          <button
                            onClick={() => {
                              handleDeleteGroup(group);
                              setShowDropdown(null);
                            }}
                            className={cn(
                              'flex w-full items-center gap-2 px-3 py-2 text-left font-serif text-sm transition-colors',
                              isDark
                                ? 'text-red-400 hover:bg-stone-600'
                                : 'text-red-600 hover:bg-stone-50'
                            )}
                          >
                            <Trash2 className="h-4 w-4" />
                            {t('list.actions.deleteGroup')}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {group.description && (
                  <p
                    className={cn(
                      'mb-4 font-serif text-sm leading-relaxed',
                      isDark ? 'text-stone-400' : 'text-stone-600'
                    )}
                  >
                    {group.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users
                      className={cn(
                        'h-4 w-4',
                        isDark ? 'text-stone-400' : 'text-stone-500'
                      )}
                    />
                    <span
                      className={cn(
                        'font-serif',
                        isDark ? 'text-stone-400' : 'text-stone-500'
                      )}
                    >
                      {t('list.memberCount', {
                        count: group.member_count || 0,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar
                      className={cn(
                        'h-4 w-4',
                        isDark ? 'text-stone-400' : 'text-stone-500'
                      )}
                    />
                    <span
                      className={cn(
                        'font-serif',
                        isDark ? 'text-stone-400' : 'text-stone-500'
                      )}
                    >
                      {formatDate(
                        group.created_at,
                        DateFormatPresets.shortDate
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingGroup && (
        <EditGroupModal
          group={editingGroup}
          isOpen={!!editingGroup}
          onClose={() => setEditingGroup(null)}
        />
      )}

      {viewingMembersGroup && (
        <GroupMembersModal
          group={viewingMembersGroup}
          isOpen={!!viewingMembersGroup}
          onClose={() => setViewingMembersGroup(null)}
        />
      )}

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => !isDeleting && setShowDeleteDialog(false)}
        onConfirm={handleConfirmDeleteGroup}
        title={t('list.actions.deleteGroup')}
        message={t('messages.deleteConfirm', {
          name: groupToDelete?.name || '',
        })}
        confirmText={t('list.actions.deleteGroup')}
        variant="danger"
        icon="delete"
        isLoading={isDeleting}
      />
    </>
  );
}
