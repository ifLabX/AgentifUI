"use client"

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@lib/utils';
import { useMobile } from '@lib/hooks';
import { useTheme } from '@lib/hooks/use-theme';
import { X, AlertTriangle, Edit, Trash } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  isLoading?: boolean;
  icon?: 'edit' | 'delete' | 'warning';
}

/**
 * 响应式确认对话框组件 - Stone风格设计
 * 桌面端：居中模态框，圆润石头风格
 * 移动端：底部弹出样式，更大的触摸区域
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText = '取消',
  variant = 'default',
  isLoading = false,
  icon = 'warning'
}: ConfirmDialogProps) {
  const { isDark } = useTheme();
  const isMobile = useMobile();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);

  // --- BEGIN COMMENT ---
  // 客户端挂载后才能使用Portal
  // --- END COMMENT ---
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // --- BEGIN COMMENT ---
  // 处理ESC键关闭
  // --- END COMMENT ---
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, isLoading]);

  // --- BEGIN COMMENT ---
  // 处理点击外部关闭
  // --- END COMMENT ---
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node) && !isLoading) {
        onClose();
      }
    };

    // 添加延迟，避免打开时立即关闭
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, isLoading]);

  // --- BEGIN COMMENT ---
  // 处理移动端滑动关闭
  // --- END COMMENT ---
  useEffect(() => {
    if (!isOpen || !isMobile || !dialogRef.current || isLoading) return;

    let startY = 0;
    let currentY = 0;
    const dialog = dialogRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;

      if (deltaY > 0) {
        dialog.style.transform = `translateY(${deltaY}px)`;
      }
    };

    const handleTouchEnd = () => {
      const deltaY = currentY - startY;

      if (deltaY > 100) {
        // 向下滑动超过阈值，关闭弹窗
        onClose();
      } else {
        // 恢复原位
        dialog.style.transform = '';
      }
    };

    dialog.addEventListener('touchstart', handleTouchStart);
    dialog.addEventListener('touchmove', handleTouchMove);
    dialog.addEventListener('touchend', handleTouchEnd);

    return () => {
      dialog.removeEventListener('touchstart', handleTouchStart);
      dialog.removeEventListener('touchmove', handleTouchMove);
      dialog.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, isMobile, onClose, isLoading]);

  // --- BEGIN COMMENT ---
  // 点击背景关闭
  // --- END COMMENT ---
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  // --- BEGIN COMMENT ---
  // 获取图标组件
  // --- END COMMENT ---
  const getIcon = () => {
    const iconClass = 'w-6 h-6';
    
    switch (icon) {
      case 'edit':
        return <Edit className={iconClass} />;
      case 'delete':
        return <Trash className={iconClass} />;
      default:
        return <AlertTriangle className={iconClass} />;
    }
  };

  // --- BEGIN COMMENT ---
  // 获取Stone风格样式类
  // --- END COMMENT ---
  const getVariantStyles = () => {
    if (variant === 'danger') {
      return {
        iconColor: isDark ? 'text-red-400' : 'text-red-500',
        iconBg: isDark ? 'bg-red-900/20' : 'bg-red-50',
        confirmButton: isDark 
          ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500/30 text-white shadow-lg shadow-red-900/20' 
          : 'bg-red-600 hover:bg-red-700 focus:ring-red-500/30 text-white shadow-lg shadow-red-900/10'
      };
    }
    
    return {
      iconColor: isDark ? 'text-stone-400' : 'text-stone-500',
      iconBg: isDark ? 'bg-stone-700/50' : 'bg-stone-100',
      confirmButton: isDark 
        ? 'bg-stone-600 hover:bg-stone-700 focus:ring-stone-500/30 text-white shadow-lg shadow-stone-900/20' 
        : 'bg-stone-600 hover:bg-stone-700 focus:ring-stone-500/30 text-white shadow-lg shadow-stone-900/10'
    };
  };

  const variantStyles = getVariantStyles();

  if (!mounted) return null;

  // --- BEGIN COMMENT ---
  // 桌面端模态框样式 - Stone风格设计
  // --- END COMMENT ---
  const desktopDialog = (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center p-4',
        'bg-black/60 backdrop-blur-md',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        'transition-all duration-300 ease-out'
      )}
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        className={cn(
          'w-full max-w-lg mx-auto rounded-2xl shadow-2xl',
          'transform transition-all duration-300 ease-out',
          isDark 
            ? 'bg-stone-900/95 border border-stone-700/50 shadow-black/40' 
            : 'bg-white/95 border border-stone-200/50 shadow-stone-900/20',
          'backdrop-blur-sm',
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
      >
        {/* --- BEGIN COMMENT ---
        桌面端图标区域 - 居中设计
        --- END COMMENT --- */}
        <div className="flex flex-col items-center pt-8 pb-6 px-8">
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center mb-6',
            'ring-1 ring-inset',
            variantStyles.iconBg,
            variantStyles.iconColor,
            isDark ? 'ring-stone-700/50' : 'ring-stone-200/50'
          )}>
            {getIcon()}
          </div>
          
          <h3 className={cn(
            'text-xl font-semibold font-serif text-center mb-3',
            isDark ? 'text-stone-100' : 'text-stone-900'
          )}>
            {title}
          </h3>
          
          <p className={cn(
            'text-sm font-serif leading-relaxed text-center max-w-sm',
            isDark ? 'text-stone-400' : 'text-stone-600'
          )}>
            {message}
          </p>
        </div>

        {/* --- BEGIN COMMENT ---
        桌面端按钮区域 - 水平布局
        --- END COMMENT --- */}
        <div className="flex items-center gap-3 p-6 pt-0 pb-8">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={cn(
              'flex-1 px-6 py-3 text-sm font-serif rounded-xl',
              'border transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              isDark 
                ? 'border-stone-600 text-stone-300 hover:bg-stone-700/50 focus:ring-stone-500/30 focus:ring-offset-stone-900' 
                : 'border-stone-300 text-stone-700 hover:bg-stone-50 focus:ring-stone-500/30 focus:ring-offset-white'
            )}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'flex-1 px-6 py-3 text-sm font-serif rounded-xl',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              variantStyles.confirmButton,
              isDark ? 'focus:ring-offset-stone-900' : 'focus:ring-offset-white'
            )}
          >
            {isLoading ? '处理中...' : confirmText}
          </button>
        </div>

        {/* --- BEGIN COMMENT ---
        关闭按钮 - 右上角
        --- END COMMENT --- */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className={cn(
            'absolute top-4 right-4 p-2 rounded-full',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-200',
            isDark 
              ? 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50' 
              : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100',
          )}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // --- BEGIN COMMENT ---
  // 移动端底部弹出样式 - Stone风格设计
  // --- END COMMENT ---
  const mobileDialog = (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-end justify-center',
        'bg-black/50 backdrop-blur-md',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        'transition-opacity duration-300 ease-out'
      )}
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        className={cn(
          'w-full max-w-lg rounded-t-3xl',
          'transform transition-transform duration-300 ease-out',
          isDark 
            ? 'bg-stone-900/95 border-t border-stone-700/50 shadow-black/40' 
            : 'bg-white/95 border-t border-stone-200/50 shadow-stone-900/20',
          'backdrop-blur-sm shadow-2xl',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        )}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* --- BEGIN COMMENT ---
        移动端顶部拖动条 - 更粗更明显
        --- END COMMENT --- */}
        <div className="flex items-center justify-center pt-4 pb-2">
          <div className={cn(
            'w-16 h-1.5 rounded-full',
            isDark ? 'bg-stone-600' : 'bg-stone-300'
          )}></div>
        </div>

        {/* --- BEGIN COMMENT ---
        移动端图标和内容区域
        --- END COMMENT --- */}
        <div className="flex flex-col items-center pt-4 pb-8 px-6">
          <div className={cn(
            'w-20 h-20 rounded-full flex items-center justify-center mb-6',
            'ring-1 ring-inset',
            variantStyles.iconBg,
            variantStyles.iconColor,
            isDark ? 'ring-stone-700/50' : 'ring-stone-200/50'
          )}>
            <div className="w-8 h-8">
              {getIcon()}
            </div>
          </div>
          
          <h3 className={cn(
            'text-xl font-semibold font-serif text-center mb-4',
            isDark ? 'text-stone-100' : 'text-stone-900'
          )}>
            {title}
          </h3>
          
          <p className={cn(
            'text-base font-serif leading-relaxed text-center mb-8 max-w-sm',
            isDark ? 'text-stone-400' : 'text-stone-600'
          )}>
            {message}
          </p>

          {/* --- BEGIN COMMENT ---
          移动端按钮区域 - 垂直排列，更大的触摸区域
          --- END COMMENT --- */}
          <div className="w-full space-y-3">
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={cn(
                'w-full py-4 text-base font-serif rounded-2xl',
                'transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                variantStyles.confirmButton,
                isDark ? 'focus:ring-offset-stone-900' : 'focus:ring-offset-white'
              )}
            >
              {isLoading ? '处理中...' : confirmText}
            </button>
            <button
              onClick={onClose}
              disabled={isLoading}
              className={cn(
                'w-full py-4 text-base font-serif rounded-2xl',
                'border transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                isDark 
                  ? 'border-stone-600 text-stone-300 hover:bg-stone-700/50 focus:ring-stone-500/30 focus:ring-offset-stone-900' 
                  : 'border-stone-300 text-stone-700 hover:bg-stone-50 focus:ring-stone-500/30 focus:ring-offset-white'
              )}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // --- BEGIN COMMENT ---
  // 根据设备类型返回相应的对话框
  // --- END COMMENT ---
  return createPortal(
    isMobile ? mobileDialog : desktopDialog,
    document.body
  );
} 