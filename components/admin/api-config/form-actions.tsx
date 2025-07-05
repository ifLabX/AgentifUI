'use client';

import { KeyCombination } from '@components/ui/adaptive-key-badge';
import { useFormattedShortcut } from '@lib/hooks/use-platform-keys';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { Loader2, Save } from 'lucide-react';

import { useTranslations } from 'next-intl';

interface FormActionsProps {
  isProcessing: boolean;
  onCancel: () => void;
}

export const FormActions = ({ isProcessing, onCancel }: FormActionsProps) => {
  const { isDark } = useTheme();
  const saveShortcut = useFormattedShortcut('SAVE_SUBMIT');
  const t = useTranslations('pages.admin.apiConfig.formActions');

  return (
    <div className="flex gap-3 pt-4">
      <button
        type="submit"
        disabled={isProcessing}
        className={cn(
          'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 font-serif font-medium transition-colors disabled:opacity-50',
          isDark
            ? 'bg-stone-600 text-white hover:bg-stone-500'
            : 'bg-stone-800 text-white hover:bg-stone-700'
        )}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        <span>{isProcessing ? t('saving') : t('save')}</span>
        {!isProcessing && (
          <KeyCombination
            keys={saveShortcut.symbols}
            size="md"
            isDark={isDark}
            className="ml-3"
          />
        )}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className={cn(
          'flex-1 cursor-pointer rounded-lg px-4 py-2 font-serif font-medium transition-colors',
          isDark
            ? 'bg-stone-700 text-stone-200 hover:bg-stone-600'
            : 'bg-stone-200 text-stone-800 hover:bg-stone-300'
        )}
      >
        {t('cancel')}
      </button>
    </div>
  );
};
