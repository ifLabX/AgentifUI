import type { NextConfig } from "next";

// --- BEGIN COMMENT ---
// 配置 Next.js，确保 stagewise 工具栏只在开发环境中可用
// Next.js 已经内置了 NODE_ENV 环境变量，不需要在配置中重新定义
// --- END COMMENT ---
const nextConfig: NextConfig = {
  /* config options here */
  
  // 确保在生产环境构建时不包含开发工具
  webpack: (config, { isServer, dev }) => {
    // 在生产环境中排除 stagewise 工具栏
    if (!dev) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@stagewise/toolbar-next': false,
      };
    }
    return config;
  },
};

export default nextConfig;
