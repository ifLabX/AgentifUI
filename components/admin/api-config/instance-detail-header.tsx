'use client';

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
  return (
    <div className="mb-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2
            className={cn(
              'font-serif text-xl font-bold',
              'text-stone-900 dark:text-stone-100'
            )}
          >
            {instance.display_name}
          </h2>
          <p
            className={cn(
              'mt-1 font-serif text-sm',
              'text-stone-600 dark:text-stone-400'
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
            'bg-stone-200 text-stone-700 hover:bg-stone-300 hover:text-stone-900 focus:ring-stone-400 dark:bg-stone-600 dark:text-stone-200 dark:hover:bg-stone-500 dark:hover:text-stone-100 dark:focus:ring-stone-500'
          )}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
