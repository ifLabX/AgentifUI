'use client';

import { useThemeColors } from '@lib/hooks/use-theme-colors';
import {
  type DifyAppType,
  getAllDifyAppTypes,
} from '@lib/types/dify-app-types';
import { cn } from '@lib/utils';

import { useTranslations } from 'next-intl';

interface DifyAppTypeSelectorProps {
  value: DifyAppType | undefined;
  onChange: (type: DifyAppType) => void;
  className?: string;
}

// Feature keys mapping for each app type
const FEATURE_KEYS_MAP: Record<DifyAppType, string[]> = {
  chatbot: ['conversation', 'fileUpload', 'speechToText'],
  agent: ['conversation', 'toolCalling', 'reasoningChain', 'multiTurnTasks'],
  chatflow: [
    'processOrchestration',
    'conditionalBranching',
    'conversationManagement',
  ],
  workflow: ['automation', 'batchProcessing', 'processControl'],
  'text-generation': ['textGeneration', 'contentCreation', 'formattedOutput'],
};

/**
 * Dify app type selector component
 * Based on the existing app_type selector design pattern
 */
export function DifyAppTypeSelector({
  value,
  onChange,
  className,
}: DifyAppTypeSelectorProps) {
  const { isDark } = useThemeColors();
  const allTypes = getAllDifyAppTypes();
  const tSelector = useTranslations(
    'pages.admin.apiConfig.page.difyAppTypeSelector'
  );
  const tDifyTypes = useTranslations('difyAppTypes');

  return (
    <div className={cn('space-y-4', className)}>
      {/* --- Title and description --- */}
      <div>
        <label
          className={cn(
            'mb-3 block font-serif text-sm font-medium',
            isDark ? 'text-stone-300' : 'text-stone-700'
          )}
        >
          {tSelector('title')}
        </label>

        {/* --- Responsive grid layout: mobile 1 column, tablet 2 columns, desktop 3 columns --- */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {allTypes.map(typeInfo => (
            <button
              key={typeInfo.key}
              type="button"
              onClick={() => onChange(typeInfo.key)}
              className={cn(
                'flex cursor-pointer flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors',
                'hover:shadow-sm active:scale-[0.98]',
                value === typeInfo.key
                  ? isDark
                    ? 'border-stone-500 bg-stone-700/50'
                    : 'border-stone-400 bg-stone-100'
                  : isDark
                    ? 'border-stone-600 hover:border-stone-500'
                    : 'border-stone-300 hover:border-stone-400'
              )}
            >
              {/* --- Top: icon, title and selection indicator --- */}
              <div className="flex w-full items-center gap-3">
                <div className="flex-shrink-0 text-2xl">{typeInfo.icon}</div>
                <div className="flex-1">
                  <div
                    className={cn(
                      'font-serif text-sm font-medium',
                      isDark ? 'text-stone-100' : 'text-stone-900'
                    )}
                  >
                    {tDifyTypes(`${typeInfo.key}.label`)}
                  </div>
                  <div
                    className={cn(
                      'font-serif text-xs',
                      isDark ? 'text-stone-400' : 'text-stone-600'
                    )}
                  >
                    {tDifyTypes(`${typeInfo.key}.description`)}
                  </div>
                </div>

                {/* --- Single select button indicator --- */}
                <div
                  className={cn(
                    'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2',
                    value === typeInfo.key
                      ? isDark
                        ? 'border-stone-400 bg-stone-400'
                        : 'border-stone-600 bg-stone-600'
                      : isDark
                        ? 'border-stone-500'
                        : 'border-stone-400'
                  )}
                >
                  {value === typeInfo.key && (
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        isDark ? 'bg-stone-800' : 'bg-white'
                      )}
                    />
                  )}
                </div>
              </div>

              {/* --- Bottom: feature tags --- */}
              <div className="mt-1 flex w-full flex-wrap gap-1">
                {FEATURE_KEYS_MAP[typeInfo.key]?.slice(0, 3).map(featureKey => (
                  <span
                    key={featureKey}
                    className={cn(
                      'rounded px-2 py-0.5 font-serif text-xs',
                      isDark
                        ? 'bg-stone-600 text-stone-300'
                        : 'bg-stone-200 text-stone-600'
                    )}
                  >
                    {tDifyTypes(`${typeInfo.key}.features.${featureKey}`)}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* --- Bottom description text --- */}
        <p
          className={cn(
            'mt-3 font-serif text-xs',
            isDark ? 'text-stone-400' : 'text-stone-500'
          )}
        >
          {tSelector('description')}
        </p>
      </div>
    </div>
  );
}

/**
 * Compact version of the Dify app type selector
 * For space-constrained scenarios
 */
export function DifyAppTypeSelectorCompact({
  value,
  onChange,
  className,
}: DifyAppTypeSelectorProps) {
  const { isDark } = useThemeColors();
  const allTypes = getAllDifyAppTypes();
  const tSelector = useTranslations(
    'pages.admin.apiConfig.page.difyAppTypeSelector'
  );
  const tDifyTypes = useTranslations('difyAppTypes');

  return (
    <div className={cn(className)}>
      <label
        className={cn(
          'mb-2 block font-serif text-sm font-medium',
          isDark ? 'text-stone-300' : 'text-stone-700'
        )}
      >
        {tSelector('titleCompact')}
      </label>

      <select
        value={value || 'chatbot'}
        onChange={e => onChange(e.target.value as DifyAppType)}
        className={cn(
          'w-full rounded-md border px-3 py-2 font-serif text-sm',
          isDark
            ? 'border-stone-600 bg-stone-700 text-stone-200'
            : 'border-stone-300 bg-white text-stone-900'
        )}
      >
        {allTypes.map(typeInfo => (
          <option key={typeInfo.key} value={typeInfo.key}>
            {typeInfo.icon} {tDifyTypes(`${typeInfo.key}.label`)} -{' '}
            {tDifyTypes(`${typeInfo.key}.description`)}
          </option>
        ))}
      </select>
    </div>
  );
}
