import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

// --- BEGIN COMMENT ---
// 配置 Next.js，使用传统 webpack 避免 Turbopack 字体加载问题
// 集成 next-intl 插件
// --- END COMMENT ---

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  
  // 生产环境自动移除 console.log
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'] // 保留 console.error 和 console.warn
    } : false
  },
  
  // 在构建时忽略 ESLint 错误
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 在构建时忽略 TypeScript 错误（可选）
  typescript: {
    ignoreBuildErrors: false, // 设为 true 可同时忽略 TS 错误
  },
  
  // Webpack 配置：解决 Supabase Realtime WebSocket 问题
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 服务端：确保 WebSocket 依赖正确加载
      config.externals = config.externals || [];
      config.externals.push({
        'bufferutil': 'bufferutil',
        'utf-8-validate': 'utf-8-validate',
      });
    }
    
    // 忽略 Supabase Realtime 的动态导入警告
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/@supabase\/realtime-js/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];
    
    return config;
  },
  
  // 使用传统 webpack，字体加载正常
};

export default withNextIntl(nextConfig);
