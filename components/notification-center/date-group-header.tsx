'use client';

import { cn } from '@lib/utils';
import { format } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';

import { useLocale } from 'next-intl';

interface DateGroupHeaderProps {
  date: string;
  className?: string;
}

export function DateGroupHeader({ date, className }: DateGroupHeaderProps) {
  const locale = useLocale();

  const getDateLocale = () => {
    switch (locale) {
      case 'zh-CN':
      case 'zh-TW':
        return zhCN;
      default:
        return enUS;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dateLocale = getDateLocale();

    return format(date, 'MMMM d, yyyy', { locale: dateLocale });
  };

  return (
    <div className={cn('mt-8 mb-4 first:mt-0', className)}>
      <h2 className="text-foreground text-lg font-semibold">
        {formatDate(date)}
      </h2>
      <div className="bg-border mt-2 h-px" />
    </div>
  );
}

export type { DateGroupHeaderProps };
