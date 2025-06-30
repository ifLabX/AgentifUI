'use client';

import type {
  Group,
  GroupMember,
  SearchableUser,
} from '@lib/db/group-permissions';
import { searchUsersForGroup } from '@lib/db/group-permissions';
import { useTheme } from '@lib/hooks/use-theme';
import { useGroupManagementStore } from '@lib/stores/group-management-store';
import { cn } from '@lib/utils';
import {
  Loader2,
  Mail,
  Plus,
  Search,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import React, { useEffect, useState } from 'react';

interface GroupMembersModalProps {
  group: Group;
  isOpen: boolean;
  onClose: () => void;
}

export function GroupMembersModal({
  group,
  isOpen,
  onClose,
}: GroupMembersModalProps) {
  const { isDark } = useTheme();
  const { groupMembers, loading, loadGroupMembers, addMember, removeMember } =
    useGroupManagementStore();

  const [showAddMember, setShowAddMember] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 获取当前群组的成员列表
  const members = groupMembers[group.id] || [];

  // 过滤成员列表
  const filteredMembers = members.filter(member => {
    const user = member.user;
    if (!user) return false;

    const searchLower = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(searchLower) ||
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  // 加载群组成员
  useEffect(() => {
    if (isOpen && group.id) {
      loadGroupMembers(group.id);
    } else if (!isOpen) {
      // 关闭时重置状态
      setSearchTerm('');
      setShowAddMember(false);
    }
  }, [isOpen, group.id, loadGroupMembers]);

  const handleRemoveMember = async (member: GroupMember) => {
    if (!member.user) return;

    const confirmMessage = `确定要将"${member.user.full_name || member.user.username}"从群组"${group.name}"中移除吗？`;
    if (window.confirm(confirmMessage)) {
      const success = await removeMember(group.id, member.user_id);
      if (success) {
        toast.success(
          `已移除成员"${member.user.full_name || member.user.username}"`
        );
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 模态框内容 */}
      <div
        className={cn(
          'relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl border shadow-lg',
          isDark ? 'border-stone-700 bg-stone-800' : 'border-stone-200 bg-white'
        )}
      >
        {/* 头部 */}
        <div
          className={cn(
            'flex items-center justify-between border-b p-6',
            isDark ? 'border-stone-700' : 'border-stone-200'
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl',
                isDark ? 'bg-stone-700' : 'bg-stone-100'
              )}
            >
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2
                className={cn(
                  'font-serif text-xl font-semibold',
                  isDark ? 'text-stone-100' : 'text-stone-900'
                )}
              >
                群组成员管理
              </h2>
              <p
                className={cn(
                  'font-serif text-sm',
                  isDark ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                {group.name} · 共 {members.length} 个成员
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddMember(true)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2 font-serif text-sm transition-all duration-200',
                isDark
                  ? 'bg-stone-600 text-white hover:bg-stone-500'
                  : 'bg-stone-700 text-white hover:bg-stone-600'
              )}
            >
              <Plus className="h-4 w-4" />
              添加成员
            </button>

            <button
              onClick={onClose}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                isDark
                  ? 'text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
              )}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 搜索栏 */}
        <div className="p-6 pb-4">
          <div className="relative">
            <Search
              className={cn(
                'absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2',
                isDark ? 'text-stone-400' : 'text-stone-500'
              )}
            />
            <input
              type="text"
              placeholder="搜索成员..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={cn(
                'w-full rounded-xl border py-3 pr-4 pl-10 font-serif transition-all duration-200',
                'focus:ring-2 focus:ring-offset-2 focus:outline-none',
                isDark
                  ? 'border-stone-600 bg-stone-700/50 text-stone-200 placeholder-stone-400 focus:border-stone-500 focus:ring-stone-500 focus:ring-offset-stone-800'
                  : 'border-stone-300 bg-stone-50 text-stone-900 placeholder-stone-500 focus:border-stone-400 focus:ring-stone-500 focus:ring-offset-white'
              )}
            />
          </div>
        </div>

        {/* 成员列表 */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loading.members ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span
                  className={cn(
                    'font-serif text-sm',
                    isDark ? 'text-stone-400' : 'text-stone-600'
                  )}
                >
                  加载成员列表...
                </span>
              </div>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div
              className={cn(
                'rounded-xl border p-12 text-center',
                isDark
                  ? 'border-stone-700 bg-stone-800'
                  : 'border-stone-200 bg-stone-50'
              )}
            >
              <Users
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
                {searchTerm ? '未找到匹配的成员' : '暂无群组成员'}
              </h3>
              <p
                className={cn(
                  'font-serif text-sm',
                  isDark ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                {searchTerm
                  ? '尝试使用其他关键词搜索'
                  : '点击"添加成员"按钮来邀请用户加入群组'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredMembers.map(member => {
                const user = member.user;
                if (!user) return null;

                return (
                  <div
                    key={member.id}
                    className={cn(
                      'flex items-center justify-between rounded-xl border p-4 transition-all duration-200',
                      isDark
                        ? 'hover:bg-stone-750 border-stone-700 bg-stone-800 hover:border-stone-600'
                        : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      {/* 用户头像 */}
                      <div
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-xl font-serif font-semibold',
                          isDark
                            ? 'bg-stone-600 text-stone-200'
                            : 'bg-stone-200 text-stone-700'
                        )}
                      >
                        {user.full_name?.[0] || user.username?.[0] || (
                          <User className="h-5 w-5" />
                        )}
                      </div>

                      {/* 用户信息 */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4
                            className={cn(
                              'font-serif font-semibold',
                              isDark ? 'text-stone-200' : 'text-stone-800'
                            )}
                          >
                            {user.full_name || user.username || '未知用户'}
                          </h4>
                          {user.username && user.full_name && (
                            <span
                              className={cn(
                                'font-serif text-sm',
                                isDark ? 'text-stone-400' : 'text-stone-500'
                              )}
                            >
                              @{user.username}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-4 text-sm">
                          {user.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span
                                className={cn(
                                  'font-serif',
                                  isDark ? 'text-stone-400' : 'text-stone-600'
                                )}
                              >
                                {user.email}
                              </span>
                            </div>
                          )}

                          <span
                            className={cn(
                              'font-serif',
                              isDark ? 'text-stone-500' : 'text-stone-500'
                            )}
                          >
                            加入于 {formatDate(member.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <button
                      onClick={() => handleRemoveMember(member)}
                      disabled={loading.members}
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        isDark
                          ? 'text-red-400 hover:bg-red-500/20 hover:text-red-300 disabled:hover:bg-transparent'
                          : 'text-red-600 hover:bg-red-50 hover:text-red-700 disabled:hover:bg-transparent'
                      )}
                      title="移除成员"
                    >
                      {loading.members ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 添加成员模态框 */}
      {showAddMember && (
        <AddMemberModal
          group={group}
          isOpen={showAddMember}
          onClose={() => setShowAddMember(false)}
        />
      )}
    </div>
  );
}

// 添加成员模态框组件
function AddMemberModal({
  group,
  isOpen,
  onClose,
}: {
  group: Group;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { isDark } = useTheme();
  const { addMember, groupMembers } = useGroupManagementStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchableUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // 重置状态当模态框关闭时
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSearchResults([]);
      setIsSearching(false);
      setIsAdding(false);
    }
  }, [isOpen]);

  // 获取当前群组成员ID列表，用于排除已存在的成员
  const currentMembers = groupMembers[group.id] || [];
  const excludeUserIds = currentMembers.map(member => member.user_id);

  // 搜索用户
  const handleSearch = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchUsersForGroup(term, excludeUserIds);
      if (result.success) {
        setSearchResults(result.data);
      } else {
        console.error('搜索用户失败:', result.error.message);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('搜索用户异常:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 防抖搜索 - 简化依赖避免频繁触发
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]); // 移除excludeUserIds依赖，避免成员变化时重新搜索

  // 添加成员
  const handleAddMember = async (user: SearchableUser) => {
    setIsAdding(true);
    try {
      const success = await addMember(group.id, user.id);
      if (success) {
        toast.success(`已将"${user.full_name || user.username}"添加到群组`);
        // 从搜索结果中移除已添加的用户，避免重新搜索
        setSearchResults(prev => prev.filter(u => u.id !== user.id));
      }
    } finally {
      setIsAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={cn(
          'relative max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-xl border shadow-lg',
          isDark ? 'border-stone-700 bg-stone-800' : 'border-stone-200 bg-white'
        )}
      >
        {/* 头部 */}
        <div
          className={cn(
            'flex items-center justify-between border-b p-6',
            isDark ? 'border-stone-700' : 'border-stone-200'
          )}
        >
          <div>
            <h3
              className={cn(
                'font-serif text-xl font-semibold',
                isDark ? 'text-stone-100' : 'text-stone-900'
              )}
            >
              添加成员
            </h3>
            <p
              className={cn(
                'font-serif text-sm',
                isDark ? 'text-stone-400' : 'text-stone-600'
              )}
            >
              搜索用户并将其添加到群组"{group.name}"
            </p>
          </div>

          <button
            onClick={onClose}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
              isDark
                ? 'text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 搜索栏 */}
        <div className="p-6 pb-4">
          <div className="relative">
            <Search
              className={cn(
                'absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2',
                isDark ? 'text-stone-400' : 'text-stone-500'
              )}
            />
            <input
              type="text"
              placeholder="搜索用户名、姓名或邮箱..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={cn(
                'w-full rounded-xl border py-3 pr-4 pl-10 font-serif transition-all duration-200',
                'focus:ring-2 focus:ring-offset-2 focus:outline-none',
                isDark
                  ? 'border-stone-600 bg-stone-700/50 text-stone-200 placeholder-stone-400 focus:border-stone-500 focus:ring-stone-500 focus:ring-offset-stone-800'
                  : 'border-stone-300 bg-stone-50 text-stone-900 placeholder-stone-500 focus:border-stone-400 focus:ring-stone-500 focus:ring-offset-white'
              )}
            />
            {isSearching && (
              <div className="absolute top-1/2 right-3 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* 搜索结果 */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {!searchTerm.trim() ? (
            <div
              className={cn(
                'rounded-xl border p-8 text-center',
                isDark
                  ? 'border-stone-700 bg-stone-800'
                  : 'border-stone-200 bg-stone-50'
              )}
            >
              <Search
                className={cn(
                  'mx-auto mb-3 h-8 w-8',
                  isDark ? 'text-stone-400' : 'text-stone-500'
                )}
              />
              <p
                className={cn(
                  'font-serif text-sm',
                  isDark ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                输入用户名、姓名或邮箱来搜索用户
              </p>
            </div>
          ) : searchResults.length === 0 && !isSearching ? (
            <div
              className={cn(
                'rounded-xl border p-8 text-center',
                isDark
                  ? 'border-stone-700 bg-stone-800'
                  : 'border-stone-200 bg-stone-50'
              )}
            >
              <Users
                className={cn(
                  'mx-auto mb-3 h-8 w-8',
                  isDark ? 'text-stone-400' : 'text-stone-500'
                )}
              />
              <p
                className={cn(
                  'font-serif text-sm',
                  isDark ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                未找到匹配的用户
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {searchResults.map(user => (
                <div
                  key={user.id}
                  className={cn(
                    'flex items-center justify-between rounded-xl border p-4 transition-all duration-200',
                    isDark
                      ? 'hover:bg-stone-750 border-stone-700 bg-stone-800 hover:border-stone-600'
                      : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* 用户头像 */}
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl font-serif font-semibold',
                        isDark
                          ? 'bg-stone-600 text-stone-200'
                          : 'bg-stone-200 text-stone-700'
                      )}
                    >
                      {user.full_name?.[0] || user.username?.[0] || (
                        <User className="h-4 w-4" />
                      )}
                    </div>

                    {/* 用户信息 */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4
                          className={cn(
                            'font-serif font-semibold',
                            isDark ? 'text-stone-200' : 'text-stone-800'
                          )}
                        >
                          {user.full_name || user.username || '未知用户'}
                        </h4>
                        {user.username && user.full_name && (
                          <span
                            className={cn(
                              'font-serif text-sm',
                              isDark ? 'text-stone-400' : 'text-stone-500'
                            )}
                          >
                            @{user.username}
                          </span>
                        )}
                      </div>

                      {user.email && (
                        <div className="mt-1 flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          <span
                            className={cn(
                              'font-serif',
                              isDark ? 'text-stone-400' : 'text-stone-600'
                            )}
                          >
                            {user.email}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 添加按钮 */}
                  <button
                    onClick={() => handleAddMember(user)}
                    disabled={isAdding}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 font-serif text-sm transition-all duration-200',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                      isDark
                        ? 'bg-stone-600 text-white hover:bg-stone-500 disabled:bg-stone-700'
                        : 'bg-stone-700 text-white hover:bg-stone-600 disabled:bg-stone-400'
                    )}
                  >
                    {isAdding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    添加
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
