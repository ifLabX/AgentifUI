'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { ServiceInstance } from '@lib/stores/api-config-store';
import { cn } from '@lib/utils';
import { X } from 'lucide-react';

interface InstanceDetailHeaderProps {
  instance: ServiceInstance;
  onClose: () => void;
}

export const InstanceDetailHeader = ({
  instance,
  onClose,
}: InstanceDetailHeaderProps) => {
  const { isDark } = useTheme();

  return (
    <div className="mb-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2
            className={cn(
              'font-serif text-xl font-bold',
              isDark ? 'text-stone-100' : 'text-stone-900'
            )}
          >
            {instance.display_name}
          </h2>
          <p
            className={cn(
              'mt-1 font-serif text-sm',
              isDark ? 'text-stone-400' : 'text-stone-600'
            )}
          >
            {instance.description || instance.instance_id}
          </p>
        </div>
        <button
          onClick={onClose}
          className={cn(
            'cursor-pointer rounded-lg p-2 transition-colors',
            'focus:ring-2 focus:ring-offset-2 focus:outline-none',
            isDark
              ? 'bg-stone-600 text-stone-200 hover:bg-stone-500 hover:text-stone-100 focus:ring-stone-500'
              : 'bg-stone-200 text-stone-700 hover:bg-stone-300 hover:text-stone-900 focus:ring-stone-400'
          )}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
