/**
 * Dify application type definitions
 * Based on Dify official API documentation type specification
 */

export type DifyAppType =
  | 'chatbot'
  | 'agent'
  | 'chatflow'
  | 'workflow'
  | 'text-generation';

export interface DifyAppTypeInfo {
  key: DifyAppType;
  label: string;
  description: string;
  icon: string;
  apiEndpoint: string; // Corresponding API endpoint
  features: string[]; // Supported feature list
  color: {
    primary: string;
    secondary: string;
  };
}

/**
 * Get Dify application type info with optional translation
 * @param type Dify application type
 * @param t Optional translation function
 * @returns Application type info, or null if invalid type
 */
export function getDifyAppTypeInfo(
  type: string,
  t?: (key: string) => string
): DifyAppTypeInfo | null {
  const typeKey = type as DifyAppType;

  if (!Object.keys(DIFY_APP_TYPES_CONFIG).includes(typeKey)) {
    return null;
  }

  const config = DIFY_APP_TYPES_CONFIG[typeKey];

  // If translation function is provided, use it; otherwise use default values
  if (t) {
    return {
      key: config.key,
      label: t(`${typeKey}.label`),
      description: t(`${typeKey}.description`),
      icon: config.icon,
      apiEndpoint: config.apiEndpoint,
      features: config.featureKeys.map(key => t(`${typeKey}.features.${key}`)),
      color: config.color,
    };
  }

  // If no translation function, return default value for backward compatibility
  return DIFY_APP_TYPES[typeKey] || null;
}

/**
 * Dify application type base config (without translation text)
 */
const DIFY_APP_TYPES_CONFIG: Record<
  DifyAppType,
  Omit<DifyAppTypeInfo, 'label' | 'description' | 'features'> & {
    featureKeys: string[];
  }
> = {
  chatbot: {
    key: 'chatbot',
    icon: '🤖',
    apiEndpoint: 'chat-messages',
    featureKeys: ['conversation', 'fileUpload', 'speechToText'],
    color: {
      primary: 'blue',
      secondary: 'blue-100',
    },
  },
  agent: {
    key: 'agent',
    icon: '🦾',
    apiEndpoint: 'chat-messages',
    featureKeys: [
      'conversation',
      'toolCalling',
      'reasoningChain',
      'multiTurnTasks',
    ],
    color: {
      primary: 'purple',
      secondary: 'purple-100',
    },
  },
  chatflow: {
    key: 'chatflow',
    icon: '🔄',
    apiEndpoint: 'chat-messages',
    featureKeys: [
      'processOrchestration',
      'conditionalBranching',
      'conversationManagement',
    ],
    color: {
      primary: 'green',
      secondary: 'green-100',
    },
  },
  workflow: {
    key: 'workflow',
    icon: '⚡',
    apiEndpoint: 'workflows/run',
    featureKeys: ['automation', 'batchProcessing', 'processControl'],
    color: {
      primary: 'orange',
      secondary: 'orange-100',
    },
  },
  'text-generation': {
    key: 'text-generation',
    icon: '📝',
    apiEndpoint: 'completion-messages',
    featureKeys: ['textGeneration', 'contentCreation', 'formattedOutput'],
    color: {
      primary: 'pink',
      secondary: 'pink-100',
    },
  },
};

/**
 * Dify application type config mapping (with default labels, for backward compatibility)
 * @deprecated Use getDifyAppTypeInfo with translation function instead
 */
export const DIFY_APP_TYPES: Record<DifyAppType, DifyAppTypeInfo> = {
  chatbot: {
    key: 'chatbot',
    label: 'Chatbot',
    description: 'Basic conversational chatbot',
    icon: '🤖',
    apiEndpoint: 'chat-messages',
    features: ['Conversation', 'File Upload', 'Speech to Text'],
    color: {
      primary: 'blue',
      secondary: 'blue-100',
    },
  },
  agent: {
    key: 'agent',
    label: 'Agent',
    description: 'Intelligent agent with tool calling support',
    icon: '🦾',
    apiEndpoint: 'chat-messages',
    features: [
      'Conversation',
      'Tool Calling',
      'Reasoning Chain',
      'Multi-turn Tasks',
    ],
    color: {
      primary: 'purple',
      secondary: 'purple-100',
    },
  },
  chatflow: {
    key: 'chatflow',
    label: 'Chatflow',
    description: 'Conversational flow orchestration application',
    icon: '🔄',
    apiEndpoint: 'chat-messages',
    features: [
      'Process Orchestration',
      'Conditional Branching',
      'Conversation Management',
    ],
    color: {
      primary: 'green',
      secondary: 'green-100',
    },
  },
  workflow: {
    key: 'workflow',
    label: 'Workflow',
    description: 'Automated workflow application',
    icon: '⚡',
    apiEndpoint: 'workflows/run',
    features: ['Automation', 'Batch Processing', 'Process Control'],
    color: {
      primary: 'orange',
      secondary: 'orange-100',
    },
  },
  'text-generation': {
    key: 'text-generation',
    label: 'Text Generation',
    description: 'Single text generation application',
    icon: '📝',
    apiEndpoint: 'completion-messages',
    features: ['Text Generation', 'Content Creation', 'Formatted Output'],
    color: {
      primary: 'pink',
      secondary: 'pink-100',
    },
  },
};

/**
 * Check if the given type is a valid Dify application type
 * @param type Application type string
 * @returns Whether it is a valid type
 */
export function isValidDifyAppType(type: string): type is DifyAppType {
  return Object.keys(DIFY_APP_TYPES).includes(type);
}

/**
 * Get all Dify application types
 * @returns Array of application type info
 */
export function getAllDifyAppTypes(): DifyAppTypeInfo[] {
  return Object.values(DIFY_APP_TYPES);
}

/**
 * Check if the application type is chat-based
 * @param type Dify application type
 * @returns Whether it is a chat-based application
 */
export function isChatBasedApp(type: DifyAppType): boolean {
  return ['chatbot', 'agent', 'chatflow'].includes(type);
}

/**
 * Check if the application type is a workflow app
 * @param type Dify application type
 * @returns Whether it is a workflow application
 */
export function isWorkflowApp(type: DifyAppType): boolean {
  return type === 'workflow';
}

/**
 * Check if the application type is a text generation app
 * @param type Dify application type
 * @returns Whether it is a text generation application
 */
export function isTextGenerationApp(type: DifyAppType): boolean {
  return type === 'text-generation';
}
