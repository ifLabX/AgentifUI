import { useCurrentAppStore } from '@lib/stores/current-app-store';
import { 
  DIFY_APP_TYPES, 
  type DifyAppType, 
  type DifyAppTypeInfo,
  isChatBasedApp,
  isWorkflowApp,
  isTextGenerationApp 
} from '@lib/types/dify-app-types';

/**
 * Dify应用类型Hook
 * 用于获取当前应用的Dify类型信息和相关判断
 */
export function useDifyAppType() {
  const { currentAppInstance } = useCurrentAppStore();
  
  // --- 获取当前应用的Dify类型，默认为chatbot ---
  const difyAppType: DifyAppType = currentAppInstance?.config?.app_metadata?.dify_apptype || 'chatbot';
  const appTypeInfo = DIFY_APP_TYPES[difyAppType];
  
  return {
    // --- 基础信息 ---
    difyAppType,
    appTypeInfo,
    
    // --- 类型判断 ---
    isChatBased: isChatBasedApp(difyAppType),
    isWorkflow: isWorkflowApp(difyAppType),
    isTextGeneration: isTextGenerationApp(difyAppType),
    
    // --- 功能判断 ---
    supportsFileUpload: ['chatbot', 'agent', 'chatflow'].includes(difyAppType),
    supportsSpeechToText: ['chatbot', 'agent', 'chatflow'].includes(difyAppType),
    supportsToolCalling: difyAppType === 'agent',
    supportsWorkflowExecution: difyAppType === 'workflow',
    
    // --- API相关 ---
    getApiEndpoint: () => appTypeInfo.apiEndpoint,
    
    // --- UI相关 ---
    getDisplayIcon: () => appTypeInfo.icon,
    getDisplayLabel: () => appTypeInfo.label,
    getDisplayDescription: () => appTypeInfo.description,
    getFeatures: () => appTypeInfo.features,
    getColorScheme: () => appTypeInfo.color,
    
    // --- 验证方法 ---
    isValidType: (type: string): type is DifyAppType => {
      return Object.keys(DIFY_APP_TYPES).includes(type);
    }
  };
}

/**
 * 用于表单中选择Dify应用类型的Hook
 * @param currentType 当前选中的类型
 * @param onChange 类型变更回调
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
    
    // --- 获取特定类型的信息 ---
    getTypeInfo: (type: DifyAppType) => DIFY_APP_TYPES[type],
    
    // --- 检查是否为当前选中类型 ---
    isSelected: (type: DifyAppType) => currentType === type,
    
    // --- 获取推荐的标签 ---
    getRecommendedTags: (type: DifyAppType): string[] => {
      const typeInfo = DIFY_APP_TYPES[type];
      return typeInfo.features.slice(0, 2); // --- 返回前两个特性作为推荐标签 ---
    }
  };
} 