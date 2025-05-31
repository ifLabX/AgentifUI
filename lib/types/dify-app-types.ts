/**
 * Dify应用类型定义
 * 基于Dify官方API文档的应用类型规范
 */

export type DifyAppType = 'chatbot' | 'agent' | 'chatflow' | 'workflow' | 'text-generation';

export interface DifyAppTypeInfo {
  key: DifyAppType;
  label: string;
  description: string;
  icon: string;
  apiEndpoint: string; // --- 对应的API端点 ---
  features: string[]; // --- 支持的功能特性 ---
  color: {
    primary: string;
    secondary: string;
  };
}

/**
 * Dify应用类型配置映射
 * 根据官方文档定义的五种应用类型
 */
export const DIFY_APP_TYPES: Record<DifyAppType, DifyAppTypeInfo> = {
  chatbot: {
    key: 'chatbot',
    label: 'Chatbot',
    description: '基础对话聊天机器人',
    icon: '🤖',
    apiEndpoint: 'chat-messages',
    features: ['对话', '文件上传', '语音转文字'],
    color: {
      primary: 'blue',
      secondary: 'blue-100'
    }
  },
  agent: {
    key: 'agent',
    label: 'Agent',
    description: '智能代理，支持工具调用',
    icon: '🦾',
    apiEndpoint: 'chat-messages',
    features: ['对话', '工具调用', '推理链', '多轮任务'],
    color: {
      primary: 'purple',
      secondary: 'purple-100'
    }
  },
  chatflow: {
    key: 'chatflow',
    label: 'Chatflow',
    description: '对话流程编排应用',
    icon: '🔄',
    apiEndpoint: 'chat-messages',
    features: ['流程编排', '条件分支', '对话管理'],
    color: {
      primary: 'green',
      secondary: 'green-100'
    }
  },
  workflow: {
    key: 'workflow',
    label: '工作流',
    description: '自动化工作流程',
    icon: '⚡',
    apiEndpoint: 'workflows/run',
    features: ['自动化', '批处理', '流程控制'],
    color: {
      primary: 'orange',
      secondary: 'orange-100'
    }
  },
  'text-generation': {
    key: 'text-generation',
    label: '文本生成',
    description: '单次文本生成应用',
    icon: '📝',
    apiEndpoint: 'completion-messages',
    features: ['文本生成', '内容创作', '格式化输出'],
    color: {
      primary: 'pink',
      secondary: 'pink-100'
    }
  }
};

/**
 * 获取应用类型信息
 * @param type Dify应用类型
 * @returns 应用类型信息，如果类型无效则返回null
 */
export function getDifyAppTypeInfo(type: string): DifyAppTypeInfo | null {
  return DIFY_APP_TYPES[type as DifyAppType] || null;
}

/**
 * 检查是否为有效的Dify应用类型
 * @param type 应用类型字符串
 * @returns 是否为有效类型
 */
export function isValidDifyAppType(type: string): type is DifyAppType {
  return Object.keys(DIFY_APP_TYPES).includes(type);
}

/**
 * 获取所有Dify应用类型列表
 * @returns 应用类型信息数组
 */
export function getAllDifyAppTypes(): DifyAppTypeInfo[] {
  return Object.values(DIFY_APP_TYPES);
}

/**
 * 根据应用类型判断是否为对话类应用
 * @param type Dify应用类型
 * @returns 是否为对话类应用
 */
export function isChatBasedApp(type: DifyAppType): boolean {
  return ['chatbot', 'agent', 'chatflow'].includes(type);
}

/**
 * 根据应用类型判断是否为工作流应用
 * @param type Dify应用类型
 * @returns 是否为工作流应用
 */
export function isWorkflowApp(type: DifyAppType): boolean {
  return type === 'workflow';
}

/**
 * 根据应用类型判断是否为文本生成应用
 * @param type Dify应用类型
 * @returns 是否为文本生成应用
 */
export function isTextGenerationApp(type: DifyAppType): boolean {
  return type === 'text-generation';
} 