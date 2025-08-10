'use client';

import { ConfirmDialog, UserAvatar } from '@components/ui';
import { Dropdown } from '@components/ui/dropdown';
import type { EnhancedUser } from '@lib/db/users';
import {
  DateFormatPresets,
  useDateFormatter,
} from '@lib/hooks/use-date-formatter';
import { useProfile } from '@lib/hooks/use-profile';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import {
  CheckSquare,
  Clock,
  Crown,
  Edit2,
  Eye,
  MoreHorizontal,
  Shield,
  Square,
  Trash2,
  UserCheck,
  UserIcon,
  UserX,
} from 'lucide-react';

import React from 'react';

import { useTranslations } from 'next-intl';

interface UserTableProps {
  users: EnhancedUser[];
  selectedUserIds: string[];
  isLoading: boolean;
  onSelectUser: (userId: string) => void;
  onSelectAll: (selected: boolean) => void;
  onEditUser: (user: EnhancedUser) => void;
  onViewUser: (user: EnhancedUser) => void;
  onDeleteUser: (user: EnhancedUser) => void;
  onChangeRole: (
    user: EnhancedUser,
    role: 'admin' | 'manager' | 'user'
  ) => void;
  onChangeStatus: (
    user: EnhancedUser,
    status: 'active' | 'suspended' | 'pending'
  ) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  selectedUserIds,
  isLoading,
  onSelectUser,
  onSelectAll,
  onEditUser,
  onViewUser,
  onDeleteUser,
  onChangeRole,
  onChangeStatus,
}) => {
  const { isDark } = useTheme();
  const { profile: currentUserProfile } = useProfile();
  const { formatDate } = useDateFormatter();
  const t = useTranslations('pages.admin.users');

  const [showRoleDialog, setShowRoleDialog] = React.useState(false);
  const [showStatusDialog, setShowStatusDialog] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<{
    user: EnhancedUser;
    type: 'role' | 'status';
    value: string;
  } | null>(null);
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Check if the user can change the user role (prevent admin from demoting other admins)
  const canChangeUserRole = (
    targetUser: EnhancedUser,
    newRole: 'admin' | 'manager' | 'user'
  ) => {
    // If the current user is not an admin, do not allow any role to be changed
    if (currentUserProfile?.role !== 'admin') {
      return false;
    }

    // Prevent admin from modifying their own role
    if (targetUser.id === currentUserProfile?.id) {
      return false;
    }

    // Prevent non-super admin from demoting other admins
    if (targetUser.role === 'admin' && newRole !== 'admin') {
      return false;
    }

    return true;
  };

  // Check if the user can be deleted (prevent deleting admin accounts)
  const canDeleteUser = (targetUser: EnhancedUser) => {
    // If the current user is not an admin, do not allow deletion
    if (currentUserProfile?.role !== 'admin') {
      return false;
    }

    // Prevent deleting yourself
    if (targetUser.id === currentUserProfile?.id) {
      return false;
    }

    // Prevent deleting other admins
    if (targetUser.role === 'admin') {
      return false;
    }

    return true;
  };

  // Check if the user can be edited
  const canEditUser = (targetUser: EnhancedUser) => {
    // Admins can edit all users (including themselves)
    if (currentUserProfile?.role === 'admin') {
      return true;
    }

    // Other roles can only edit themselves
    return targetUser.id === currentUserProfile?.id;
  };

  const handleRoleChange = (
    user: EnhancedUser,
    role: 'admin' | 'manager' | 'user'
  ) => {
    setPendingAction({ user, type: 'role', value: role });
    setShowRoleDialog(true);
  };

  const handleStatusChange = (
    user: EnhancedUser,
    status: 'active' | 'suspended' | 'pending'
  ) => {
    setPendingAction({ user, type: 'status', value: status });
    setShowStatusDialog(true);
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    setIsUpdating(true);
    try {
      if (pendingAction.type === 'role') {
        await onChangeRole(
          pendingAction.user,
          pendingAction.value as 'admin' | 'manager' | 'user'
        );
        setShowRoleDialog(false);
      } else {
        await onChangeStatus(
          pendingAction.user,
          pendingAction.value as 'active' | 'suspended' | 'pending'
        );
        setShowStatusDialog(false);
      }
      setPendingAction(null);
    } finally {
      setIsUpdating(false);
    }
  };

  // Get role display information - use stone theme colors
  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          label: t('messages.roles.admin'),
          icon: <Shield className="h-4 w-4" />,
          variant: 'danger' as const,
        };
      case 'manager':
        return {
          label: t('messages.roles.manager'),
          icon: <Crown className="h-4 w-4" />,
          variant: 'warning' as const,
        };
      default:
        return {
          label: t('messages.roles.user'),
          icon: <UserIcon className="h-4 w-4" />,
          variant: 'neutral' as const,
        };
    }
  };

  // Get status display information - use stone theme colors
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: t('messages.statuses.active'),
          icon: <UserCheck className="h-4 w-4" />,
          variant: 'success' as const,
        };
      case 'suspended':
        return {
          label: t('messages.statuses.suspended'),
          icon: <UserX className="h-4 w-4" />,
          variant: 'danger' as const,
        };
      case 'pending':
        return {
          label: t('messages.statuses.pending'),
          icon: <Clock className="h-4 w-4" />,
          variant: 'warning' as const,
        };
      default:
        return {
          label: t('messages.statuses.pending'), // use pending as default value
          icon: <Clock className="h-4 w-4" />,
          variant: 'neutral' as const,
        };
    }
  };

  // Get stone theme label style
  const getBadgeClasses = (
    variant: 'success' | 'warning' | 'danger' | 'neutral'
  ) => {
    const variantMap = {
      success: isDark
        ? 'bg-emerald-900/30 text-emerald-300 border-emerald-700'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      warning: isDark
        ? 'bg-amber-900/30 text-amber-300 border-amber-700'
        : 'bg-amber-50 text-amber-700 border-amber-200',
      danger: isDark
        ? 'bg-red-900/30 text-red-300 border-red-700'
        : 'bg-red-50 text-red-700 border-red-200',
      neutral: isDark
        ? 'bg-stone-700/50 text-stone-300 border-stone-600'
        : 'bg-stone-100 text-stone-700 border-stone-300',
    };
    return variantMap[variant];
  };

  // Check if all are selected
  const isAllSelected =
    users.length > 0 && selectedUserIds.length === users.length;
  const isPartiallySelected = selectedUserIds.length > 0 && !isAllSelected;

  if (isLoading) {
    return (
      <div
        className={cn(
          'overflow-hidden rounded-xl border shadow-sm',
          isDark
            ? 'border-stone-700/50 bg-stone-800/50'
            : 'border-stone-200/50 bg-white'
        )}
      >
        <div className="p-12 text-center">
          <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-b-2 border-stone-400"></div>
          <p
            className={cn(
              'font-serif text-lg',
              isDark ? 'text-stone-400' : 'text-stone-600'
            )}
          >
            {t('table.loading')}
          </p>
          <p
            className={cn(
              'mt-2 font-serif text-sm',
              isDark ? 'text-stone-500' : 'text-stone-500'
            )}
          >
            {t('table.loadingSubtext')}
          </p>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl border p-12 text-center shadow-sm',
          isDark
            ? 'border-stone-700/50 bg-stone-800/50'
            : 'border-stone-200/50 bg-white'
        )}
      >
        <div
          className={cn(
            'mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full',
            isDark ? 'bg-stone-700/50' : 'bg-stone-100'
          )}
        >
          <UserIcon
            className={cn(
              'h-8 w-8',
              isDark ? 'text-stone-500' : 'text-stone-400'
            )}
          />
        </div>
        <h3
          className={cn(
            'mb-3 font-serif text-xl font-semibold',
            isDark ? 'text-stone-300' : 'text-stone-700'
          )}
        >
          {t('table.noData')}
        </h3>
        <p
          className={cn(
            'mb-4 font-serif text-base',
            isDark ? 'text-stone-500' : 'text-stone-500'
          )}
        >
          {t('table.noDataSubtext')}
        </p>
        <p
          className={cn(
            'font-serif text-sm',
            isDark ? 'text-stone-600' : 'text-stone-400'
          )}
        >
          {t('table.noDataHint')}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border shadow-sm',
        isDark
          ? 'border-stone-700/50 bg-stone-800/50'
          : 'border-stone-200/50 bg-white'
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead
            className={cn(
              'border-b',
              isDark
                ? 'border-stone-700/50 bg-stone-900/50'
                : 'border-stone-200/50 bg-stone-50/80'
            )}
          >
            <tr>
              <th className="w-12 px-4 py-4">
                <button
                  onClick={() => onSelectAll(!isAllSelected)}
                  className={cn(
                    'flex items-center justify-center rounded-md p-1 transition-colors',
                    isDark
                      ? 'text-stone-400 hover:bg-stone-700/50 hover:text-stone-300'
                      : 'text-stone-600 hover:bg-stone-100/50 hover:text-stone-700'
                  )}
                >
                  {isAllSelected ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : isPartiallySelected ? (
                    <Square className="h-4 w-4 border-2" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </th>
              <th
                className={cn(
                  'w-48 px-4 py-4 text-left font-serif text-sm font-semibold',
                  isDark ? 'text-stone-300' : 'text-stone-700'
                )}
              >
                {t('table.headers.userInfo')}
              </th>
              <th
                className={cn(
                  'w-44 px-4 py-4 text-left font-serif text-sm font-semibold',
                  isDark ? 'text-stone-300' : 'text-stone-700'
                )}
              >
                {t('table.headers.contact')}
              </th>
              <th
                className={cn(
                  'w-40 px-4 py-4 text-left font-serif text-sm font-semibold',
                  isDark ? 'text-stone-300' : 'text-stone-700'
                )}
              >
                {t('table.headers.groups')}
              </th>
              <th
                className={cn(
                  'w-36 px-4 py-4 text-left font-serif text-sm font-semibold',
                  isDark ? 'text-stone-300' : 'text-stone-700'
                )}
              >
                {t('table.headers.rolePermissions')}
              </th>
              <th
                className={cn(
                  'w-28 px-4 py-4 text-left font-serif text-sm font-semibold',
                  isDark ? 'text-stone-300' : 'text-stone-700'
                )}
              >
                {t('table.headers.status')}
              </th>
              <th
                className={cn(
                  'w-32 px-4 py-4 text-left font-serif text-sm font-semibold',
                  isDark ? 'text-stone-300' : 'text-stone-700'
                )}
              >
                {t('table.headers.lastLogin')}
              </th>
              <th
                className={cn(
                  'w-32 px-4 py-4 text-left font-serif text-sm font-semibold',
                  isDark ? 'text-stone-300' : 'text-stone-700'
                )}
              >
                {t('table.headers.registerTime')}
              </th>
              <th className="w-16 px-4 py-4"></th>
            </tr>
          </thead>

          <tbody>
            {users.map(user => {
              const isSelected = selectedUserIds.includes(user.id);
              const roleInfo = getRoleInfo(user.role);
              const statusInfo = getStatusInfo(user.status);

              return (
                <tr
                  key={user.id}
                  className={cn(
                    'h-20 border-b transition-all duration-200', // Fixed row height
                    isDark ? 'border-stone-700/50' : 'border-stone-200/50',
                    isSelected
                      ? isDark
                        ? 'bg-stone-700/30'
                        : 'bg-stone-100/70'
                      : isDark
                        ? 'hover:bg-stone-800/50'
                        : 'hover:bg-stone-50/70',
                    'hover:shadow-sm'
                  )}
                >
                  <td className="px-4 py-4">
                    <button
                      onClick={() => onSelectUser(user.id)}
                      className={cn(
                        'flex items-center justify-center rounded-md p-1 transition-colors',
                        isDark
                          ? 'text-stone-400 hover:bg-stone-700/50 hover:text-stone-300'
                          : 'text-stone-600 hover:bg-stone-100/50 hover:text-stone-700'
                      )}
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <UserAvatar
                          avatarUrl={user.avatar_url}
                          userName={
                            user.full_name ||
                            user.username ||
                            t('actions.defaultUser')
                          }
                          size="md"
                        />
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-center space-x-1">
                          <span
                            className={cn(
                              'truncate font-serif text-sm font-medium',
                              isDark ? 'text-stone-200' : 'text-stone-800'
                            )}
                          >
                            {user.full_name ||
                              user.username ||
                              t('actions.notSet')}
                          </span>
                          {user.role === 'admin' && (
                            <span className="text-xs text-red-500">👑</span>
                          )}
                        </div>
                        <span
                          className={cn(
                            'truncate font-serif text-xs',
                            isDark ? 'text-stone-500' : 'text-stone-500'
                          )}
                        >
                          @{user.username || t('actions.notSet')}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="min-w-0 space-y-1">
                      <p
                        className={cn(
                          'flex items-center gap-1 truncate font-serif text-sm',
                          isDark ? 'text-stone-300' : 'text-stone-700'
                        )}
                        title={user.email || t('actions.notSetEmail')}
                      >
                        <span className="text-xs">
                          {t('actions.emailIcon')}
                        </span>
                        <span className="truncate">
                          {user.email || t('actions.notSet')}
                        </span>
                      </p>
                      <p
                        className={cn(
                          'flex items-center gap-1 truncate font-serif text-sm',
                          isDark ? 'text-stone-400' : 'text-stone-600'
                        )}
                        title={user.phone || t('actions.notSetPhone')}
                      >
                        <span className="text-xs">
                          {t('actions.phoneIcon')}
                        </span>
                        <span className="truncate">
                          {user.phone
                            ? user.phone.startsWith('86')
                              ? user.phone.slice(2)
                              : user.phone
                            : t('actions.notSet')}
                        </span>
                      </p>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex h-16 flex-col justify-center space-y-1">
                      {user.groups && user.groups.length > 0 ? (
                        <>
                          {user.groups.slice(0, 2).map(group => (
                            <p
                              key={group.id}
                              className={cn(
                                'truncate font-serif text-sm',
                                isDark ? 'text-stone-300' : 'text-stone-700'
                              )}
                              title={group.description || group.name}
                            >
                              {group.name}
                            </p>
                          ))}
                          {user.groups.length > 2 && (
                            <p
                              className={cn(
                                'truncate font-serif text-xs',
                                isDark ? 'text-stone-400' : 'text-stone-500'
                              )}
                              title={t('actions.moreGroupsTooltip', {
                                count: user.groups.length - 2,
                                names: user.groups
                                  .slice(2)
                                  .map(g => g.name)
                                  .join(', '),
                              })}
                            >
                              {t('actions.moreGroups', {
                                count: user.groups.length - 2,
                              })}
                            </p>
                          )}
                        </>
                      ) : (
                        <p
                          className={cn(
                            'font-serif text-sm',
                            isDark ? 'text-stone-500' : 'text-stone-500'
                          )}
                        >
                          {t('actions.notInGroup')}
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="min-w-0 px-4 py-4">
                    <div
                      className={cn(
                        'inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1 font-serif text-xs font-medium',
                        getBadgeClasses(roleInfo.variant)
                      )}
                      title={roleInfo.label}
                    >
                      {roleInfo.icon}
                      <span className="truncate">{roleInfo.label}</span>
                    </div>
                  </td>

                  <td className="min-w-0 px-4 py-4">
                    <div
                      className={cn(
                        'inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1 font-serif text-xs font-medium',
                        getBadgeClasses(statusInfo.variant)
                      )}
                      title={statusInfo.label}
                    >
                      {statusInfo.icon}
                      <span className="truncate">{statusInfo.label}</span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <p
                      className={cn(
                        'truncate font-serif text-sm',
                        isDark ? 'text-stone-300' : 'text-stone-700'
                      )}
                      title={formatDate(
                        user.last_sign_in_at,
                        DateFormatPresets.dateTime
                      )}
                    >
                      {formatDate(
                        user.last_sign_in_at,
                        DateFormatPresets.dateTime
                      )}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <p
                      className={cn(
                        'truncate font-serif text-sm',
                        isDark ? 'text-stone-300' : 'text-stone-700'
                      )}
                      title={formatDate(
                        user.created_at,
                        DateFormatPresets.dateTime
                      )}
                    >
                      {formatDate(user.created_at, DateFormatPresets.dateTime)}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <Dropdown
                      trigger={
                        <button
                          className={cn(
                            'rounded-lg p-2 transition-colors',
                            isDark
                              ? 'text-stone-400 hover:bg-stone-700/50 hover:text-stone-300'
                              : 'text-stone-600 hover:bg-stone-100/50 hover:text-stone-700'
                          )}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      }
                    >
                      <div className="py-1">
                        <button
                          onClick={() => onViewUser(user)}
                          className={cn(
                            'flex w-full items-center gap-3 px-4 py-2 font-serif text-sm transition-colors',
                            isDark
                              ? 'text-stone-300 hover:bg-stone-700 hover:text-stone-100'
                              : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                          )}
                        >
                          <Eye className="h-4 w-4" />
                          {t('actions.viewDetails')}
                        </button>

                        <button
                          onClick={() => onEditUser(user)}
                          disabled={!canEditUser(user)}
                          className={cn(
                            'flex w-full items-center gap-3 px-4 py-2 font-serif text-sm transition-colors',
                            !canEditUser(user)
                              ? isDark
                                ? 'cursor-not-allowed text-stone-600'
                                : 'cursor-not-allowed text-stone-400'
                              : isDark
                                ? 'text-stone-300 hover:bg-stone-700 hover:text-stone-100'
                                : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                          )}
                        >
                          <Edit2 className="h-4 w-4" />
                          {t('actions.editInfo')}
                        </button>

                        <div
                          className={cn(
                            'my-1 h-px',
                            isDark ? 'bg-stone-700' : 'bg-stone-200'
                          )}
                        />

                        <div
                          className={cn(
                            'px-4 py-2 font-serif text-xs font-semibold tracking-wider uppercase',
                            isDark ? 'text-stone-500' : 'text-stone-500'
                          )}
                        >
                          {t('actions.changeRole')}
                        </div>

                        {(['admin', 'manager', 'user'] as const).map(role => {
                          const roleInfo = getRoleInfo(role);
                          const canChange = canChangeUserRole(user, role);
                          const isCurrent = user.role === role;

                          return (
                            <button
                              key={role}
                              onClick={() => handleRoleChange(user, role)}
                              disabled={!canChange || isCurrent}
                              className={cn(
                                'flex w-full items-center gap-3 px-4 py-2 font-serif text-sm transition-colors',
                                !canChange || isCurrent
                                  ? isDark
                                    ? 'cursor-not-allowed text-stone-600'
                                    : 'cursor-not-allowed text-stone-400'
                                  : isDark
                                    ? 'text-stone-300 hover:bg-stone-700 hover:text-stone-100'
                                    : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                              )}
                            >
                              {roleInfo.icon}
                              {roleInfo.label}
                              {isCurrent && (
                                <span className="ml-auto text-xs">
                                  {t('actions.current')}
                                </span>
                              )}
                              {!canChange &&
                                !isCurrent &&
                                user.id === currentUserProfile?.id && (
                                  <span className="ml-auto text-xs">
                                    {t('actions.self')}
                                  </span>
                                )}
                              {!canChange &&
                                !isCurrent &&
                                user.role === 'admin' &&
                                user.id !== currentUserProfile?.id && (
                                  <span className="ml-auto text-xs">
                                    {t('actions.admin')}
                                  </span>
                                )}
                            </button>
                          );
                        })}

                        <div
                          className={cn(
                            'my-1 h-px',
                            isDark ? 'bg-stone-700' : 'bg-stone-200'
                          )}
                        />

                        <div
                          className={cn(
                            'px-4 py-2 font-serif text-xs font-semibold tracking-wider uppercase',
                            isDark ? 'text-stone-500' : 'text-stone-500'
                          )}
                        >
                          {t('actions.changeStatus')}
                        </div>

                        {(['active', 'suspended', 'pending'] as const).map(
                          status => {
                            const statusInfo = getStatusInfo(status);
                            const isCurrent = user.status === status;

                            return (
                              <button
                                key={status}
                                onClick={() => handleStatusChange(user, status)}
                                disabled={isCurrent}
                                className={cn(
                                  'flex w-full items-center gap-3 px-4 py-2 font-serif text-sm transition-colors',
                                  isCurrent
                                    ? isDark
                                      ? 'cursor-not-allowed text-stone-600'
                                      : 'cursor-not-allowed text-stone-400'
                                    : isDark
                                      ? 'text-stone-300 hover:bg-stone-700 hover:text-stone-100'
                                      : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                                )}
                              >
                                {statusInfo.icon}
                                {statusInfo.label}
                                {isCurrent && (
                                  <span className="ml-auto text-xs">
                                    {t('actions.current')}
                                  </span>
                                )}
                              </button>
                            );
                          }
                        )}

                        <div
                          className={cn(
                            'my-1 h-px',
                            isDark ? 'bg-stone-700' : 'bg-stone-200'
                          )}
                        />

                        <button
                          onClick={() => onDeleteUser(user)}
                          disabled={!canDeleteUser(user)}
                          className={cn(
                            'flex w-full items-center gap-3 px-4 py-2 font-serif text-sm transition-colors',
                            !canDeleteUser(user)
                              ? isDark
                                ? 'cursor-not-allowed text-stone-600'
                                : 'cursor-not-allowed text-stone-400'
                              : isDark
                                ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300'
                                : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                          )}
                        >
                          <Trash2 className="h-4 w-4" />
                          {t('actions.deleteUser')}
                          {!canDeleteUser(user) &&
                            user.id === currentUserProfile?.id && (
                              <span className="ml-auto text-xs">
                                {t('actions.self')}
                              </span>
                            )}
                          {!canDeleteUser(user) &&
                            user.role === 'admin' &&
                            user.id !== currentUserProfile?.id && (
                              <span className="ml-auto text-xs">
                                {t('actions.admin')}
                              </span>
                            )}
                        </button>
                      </div>
                    </Dropdown>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={showRoleDialog}
        onClose={() => !isUpdating && setShowRoleDialog(false)}
        onConfirm={handleConfirmAction}
        title={t('actions.changeRole')}
        message={t('messages.roleChangeConfirm', {
          name:
            pendingAction?.user?.full_name ||
            pendingAction?.user?.email ||
            'Unknown User',
          role:
            pendingAction?.value && pendingAction?.type === 'role'
              ? t(`messages.roles.${pendingAction.value}`)
              : pendingAction?.value || '',
        })}
        confirmText={t('actions.changeRole')}
        variant="default"
        icon="edit"
        isLoading={isUpdating}
      />

      <ConfirmDialog
        isOpen={showStatusDialog}
        onClose={() => !isUpdating && setShowStatusDialog(false)}
        onConfirm={handleConfirmAction}
        title={t('actions.changeStatus')}
        message={t('messages.statusChangeConfirm', {
          name:
            pendingAction?.user?.full_name ||
            pendingAction?.user?.email ||
            'Unknown User',
          status:
            pendingAction?.value && pendingAction?.type === 'status'
              ? t(`messages.statuses.${pendingAction.value}`)
              : pendingAction?.value || '',
        })}
        confirmText={t('actions.changeStatus')}
        variant="default"
        icon="edit"
        isLoading={isUpdating}
      />
    </div>
  );
};
