'use client';

import { MobileNavButton } from '@components/mobile';
import { useMobile } from '@lib/hooks';
import { useTheme } from '@lib/hooks/use-theme';
import { useSidebarStore } from '@lib/stores/sidebar-store';
// NavBar 已移至根布局，无需在此处引入
import { cn } from '@lib/utils';

interface ChatLayoutProps {
  children: React.ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const { isExpanded, isMounted } = useSidebarStore();
  const isMobile = useMobile();
  const { isDark } = useTheme();

  // 🎯 移除重复的 setMounted 调用，现在由全局 ClientLayout 统一管理
  // 计算主内容区域的左边距
  // 根据sidebar展开状态设置边距，推动主内容
  const getMainMarginLeft = () => {
    if (isMobile) return 'ml-0';
    return isExpanded ? 'ml-64' : 'ml-16';
  };

  return (
    <div
      className={cn(
        'flex h-full min-h-screen',
        isDark ? 'bg-stone-900' : 'bg-stone-50'
      )}
    >
      {/* 🎯 Sidebar 已移至根布局，无需重复渲染 */}

      {/* 
        移动端导航按钮 - 仅在客户端挂载后显示 
      */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        {isMounted && <MobileNavButton />}
      </div>

      {/* 主内容区域 - 确保聊天页面有固定高度和正确的滚动行为 */}
      <main
        className={cn(
          'h-screen w-full overflow-auto', // 使用 w-full 而不是 flex-1
          getMainMarginLeft(),
          // 过渡效果
          'transition-[margin-left] duration-150 ease-in-out'
        )}
      >
        <div className="h-full p-0">{children}</div>
      </main>
    </div>
  );
}
