import { useCurrentAppStore } from '@lib/stores/current-app-store';
import {
  DIFY_APP_TYPES,
  type DifyAppType,
  isChatBasedApp,
  isTextGenerationApp,
  isWorkflowApp,
} from '@lib/types/dify-app-types';

/**
 * Dify app type hook
 * Provides access to the current app's Dify type info and related checks
 */
export function useDifyAppType() {
  const { currentAppInstance } = useCurrentAppStore();

  // Get the current app's Dify type, default to 'chatbot'
  const difyAppType: DifyAppType =
    currentAppInstance?.config?.app_metadata?.dify_apptype || 'chatbot';
  const appTypeInfo = DIFY_APP_TYPES[difyAppType];

  return {
    // Basic info
    difyAppType,
    appTypeInfo,

    // Type checks
    isChatBased: isChatBasedApp(difyAppType),
    isWorkflow: isWorkflowApp(difyAppType),
    isTextGeneration: isTextGenerationApp(difyAppType),

    // Feature support checks
    supportsFileUpload: ['chatbot', 'agent', 'chatflow'].includes(difyAppType),
    supportsSpeechToText: ['chatbot', 'agent', 'chatflow'].includes(
      difyAppType
    ),
    supportsToolCalling: difyAppType === 'agent',
    supportsWorkflowExecution: difyAppType === 'workflow',

    // API related
    getApiEndpoint: () => appTypeInfo.apiEndpoint,

    // UI related
    getDisplayIcon: () => appTypeInfo.icon,
    getDisplayLabel: () => appTypeInfo.label,
    getDisplayDescription: () => appTypeInfo.description,
    getFeatures: () => appTypeInfo.features,
    getColorScheme: () => appTypeInfo.color,

    // Validation method
    isValidType: (type: string): type is DifyAppType => {
      return Object.keys(DIFY_APP_TYPES).includes(type);
    },
  };
}

/**
 * Hook for selecting Dify app type in forms
 * @param currentType The currently selected type
 * @param onChange Callback for type change
 */
export function useDifyAppTypeSelector(
  currentType: DifyAppType | undefined,
  onChange: (type: DifyAppType) => void
) {
  const allTypes = Object.values(DIFY_APP_TYPES);

  return {
    allTypes,
    currentType: currentType || 'chatbot',
    onChange,

    // Get info for a specific type
    getTypeInfo: (type: DifyAppType) => DIFY_APP_TYPES[type],

    // Check if a type is currently selected
    isSelected: (type: DifyAppType) => currentType === type,

    // Get recommended tags for a type (first two features)
    getRecommendedTags: (type: DifyAppType): string[] => {
      const typeInfo = DIFY_APP_TYPES[type];
      return typeInfo.features.slice(0, 2);
    },
  };
}
