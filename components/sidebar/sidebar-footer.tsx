'use client';

import { MobileUserButton } from '@components/mobile';
import { TooltipWrapper } from '@components/ui/tooltip-wrapper';
import { useMobile } from '@lib/hooks/use-mobile';
import { useSidebarStore } from '@lib/stores/sidebar-store';
import { cn } from '@lib/utils';
import { Settings, Sliders } from 'lucide-react';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';

import { SidebarButton } from './sidebar-button';

export function SidebarFooter() {
  const isMobile = useMobile();
  const router = useRouter();
  const pathname = usePathname();
  const { isExpanded } = useSidebarStore();
  const t = useTranslations('sidebar');

  // 🎯 设置页面激活状态检测
  const isSettingsActive = pathname === '/settings';

  return (
    <div className={cn('mt-auto flex flex-col gap-1.5 p-3')}>
      {!isMobile &&
        // 在slim状态下显示右侧tooltip，展开状态下不显示tooltip
        (isExpanded ? (
          <SidebarButton
            icon={
              <Sliders
                className={cn('h-5 w-5 transition-transform duration-300')}
              />
            }
            active={isSettingsActive}
            onClick={() => {
              router.push('/settings');
            }}
            aria-label={t('settings')}
            variant="transparent"
            className="group"
          >
            <span className="font-serif">{t('settings')}</span>
          </SidebarButton>
        ) : (
          <TooltipWrapper
            content={t('settings')}
            id="sidebar-footer-settings-tooltip"
            placement="right"
            size="sm"
            showArrow={false}
          >
            <SidebarButton
              icon={
                <Sliders
                  className={cn('h-5 w-5 transition-transform duration-300')}
                />
              }
              active={isSettingsActive}
              onClick={() => {
                router.push('/settings');
              }}
              aria-label={t('settings')}
              variant="transparent"
              className="group"
            >
              <span className="font-serif">{t('settings')}</span>
            </SidebarButton>
          </TooltipWrapper>
        ))}
      {isMobile && <MobileUserButton />}
    </div>
  );
}
