'use client';

import type { Group } from '@lib/db/group-permissions';
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
import { toast } from 'react-hot-toast';

import { useState } from 'react';

import { EditGroupModal } from './edit-group-modal';

interface GroupsListProps {
  groups: Group[];
  isLoading: boolean;
}

export function GroupsList({ groups, isLoading }: GroupsListProps) {
  const { isDark } = useTheme();
  const { deleteGroup, groupMembers, loadGroupMembers } =
    useGroupManagementStore();
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const handleDeleteGroup = async (group: Group) => {
    if (window.confirm(`确定要删除群组"${group.name}"吗？此操作不可撤销。`)) {
      const success = await deleteGroup(group.id);
      if (success) {
        toast.success(`已删除群组"${group.name}"`);
      }
    }
  };

  const handleViewMembers = async (group: Group) => {
    await loadGroupMembers(group.id);
    const members = groupMembers[group.id] || [];
    toast.success(`群组"${group.name}"共有 ${members.length} 个成员`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
          暂无群组
        </h3>
        <p
          className={cn(
            'font-serif text-sm',
            isDark ? 'text-stone-400' : 'text-stone-600'
          )}
        >
          点击"创建群组"按钮来创建第一个群组
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
              'rounded-xl border p-6 shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl',
              isDark
                ? 'border-stone-700/50 bg-stone-800/60 shadow-stone-900/20'
                : 'border-stone-200/50 bg-white/80 shadow-stone-200/50'
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                    )}
                  >
                    <Building2
                      className={cn(
                        'h-5 w-5',
                        isDark ? 'text-blue-400' : 'text-blue-600'
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

                {group.description && (
                  <p
                    className={cn(
                      'mb-4 font-serif text-sm',
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    )}
                  >
                    {group.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Users
                      className={cn(
                        'h-3 w-3',
                        isDark ? 'text-stone-400' : 'text-stone-500'
                      )}
                    />
                    <span
                      className={cn(
                        'font-serif',
                        isDark ? 'text-stone-400' : 'text-stone-500'
                      )}
                    >
                      {group.member_count || 0} 成员
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar
                      className={cn(
                        'h-3 w-3',
                        isDark ? 'text-stone-400' : 'text-stone-500'
                      )}
                    />
                    <span
                      className={cn(
                        'font-serif',
                        isDark ? 'text-stone-400' : 'text-stone-500'
                      )}
                    >
                      {formatDate(group.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() =>
                    setShowDropdown(showDropdown === group.id ? null : group.id)
                  }
                  className={cn(
                    'rounded-lg p-2 transition-colors',
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
                        查看成员
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
                        编辑群组
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
                        删除群组
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 编辑群组模态框 */}
      {editingGroup && (
        <EditGroupModal
          group={editingGroup}
          isOpen={!!editingGroup}
          onClose={() => setEditingGroup(null)}
        />
      )}
    </>
  );
}
