// --- BEGIN COMMENT ---
// About页面配置管理
// 用于集中管理About页面的内容配置，支持动态修改
// --- END COMMENT ---

export interface ValueCard {
  id: string;
  title: string;
  description: string;
}

export interface AboutPageConfig {
  title: string;
  subtitle: string;
  mission: string;
  valueCards: ValueCard[];
  buttonText: string;
  copyrightText: string;
}

// --- BEGIN COMMENT ---
// 默认的About页面配置
// 这些配置可以通过管理界面进行修改
// --- END COMMENT ---
export const defaultAboutConfig: AboutPageConfig = {
  title: '关于 AgentifUI',
  subtitle: '连接 AI 与企业，打造大模型应用新体验',
  mission:
    'AgentifUI 致力于利用大型语言模型的力量，为企业提供创新的应用解决方案。我们整合了多种模型供应商的能力，并基于 Dify 后端提供稳定、可靠的服务，帮助团队充分利用 AI 技术的价值。',
  valueCards: [
    {
      id: '1',
      title: '技术创新',
      description: '持续集成前沿的大模型技术，为企业提供领先的 AI 解决方案',
    },
    {
      id: '2',
      title: '数据安全',
      description:
        '支持私有化部署和严格的数据保护措施，确保企业数据的安全与隐私',
    },
    {
      id: '3',
      title: '灵活定制',
      description: '提供高度可定制的解决方案，满足不同行业和场景的特定需求',
    },
    {
      id: '4',
      title: '知识增强',
      description:
        '通过 RAG 技术实现私有知识库的整合，增强模型的上下文感知能力',
    },
  ],
  buttonText: '开始探索',
  copyrightText: `© ${new Date().getFullYear()} AgentifUI. 探索大模型应用的未来。`,
};

// --- BEGIN COMMENT ---
// 获取About页面配置
// 这里可以从数据库或API获取配置，目前返回默认配置
// --- END COMMENT ---
export async function getAboutConfig(): Promise<AboutPageConfig> {
  // --- BEGIN COMMENT ---
  // 实际应用中，这里应该从数据库或配置服务获取
  // 例如: return await fetchAboutConfigFromAPI()
  // --- END COMMENT ---
  try {
    // --- BEGIN COMMENT ---
    // 尝试从localStorage获取配置 (仅用于演示)
    // --- END COMMENT ---
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('about-page-config');
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch (error) {
    console.warn('Failed to load about config from storage:', error);
  }

  return defaultAboutConfig;
}

// --- BEGIN COMMENT ---
// 保存About页面配置
// 实际应用中应该保存到数据库，这里使用localStorage演示
// --- END COMMENT ---
export async function saveAboutConfig(config: AboutPageConfig): Promise<void> {
  try {
    // --- BEGIN COMMENT ---
    // 实际应用中，这里应该调用API保存到数据库
    // 例如: await saveAboutConfigToAPI(config)
    // --- END COMMENT ---

    // --- BEGIN COMMENT ---
    // 临时使用localStorage存储 (仅用于演示)
    // --- END COMMENT ---
    if (typeof window !== 'undefined') {
      localStorage.setItem('about-page-config', JSON.stringify(config));
    }

    console.log('About配置保存成功:', config);
  } catch (error) {
    console.error('Failed to save about config:', error);
    throw error;
  }
}
