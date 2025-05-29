import type { Metadata } from "next";
import { Inter, Crimson_Pro, Playfair_Display, Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import { TooltipContainer } from "@components/ui/tooltip";
import { Toaster } from 'react-hot-toast';
import "./globals.css";
import "../styles/markdown-variables.css";
import "../styles/markdown.css";
import "../styles/prism-custom.css"; // 导入自定义Prism样式
import { NotificationBar } from '@components/ui/notification-bar';
import { ClientLayout } from "./layouts/client-layout";
import { cn } from "@lib/utils";
import { Providers } from "./providers"; // 确保导入 Providers 组件
import { DynamicTitle } from "@components/ui/dynamic-title"; // 导入动态标题组件
import { StagewiseToolbarWrapper } from "@components/dev/stagewise-toolbar";

// --- BEGIN COMMENT ---
// 🎯 Claude 风格的中英文字体配置
// Inter + 思源黑体：现代简洁的界面字体
// Crimson Pro + 思源宋体：优雅易读的阅读字体  
// Playfair Display：装饰性标题字体
// --- END COMMENT ---
const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
});

const notoSansSC = Noto_Sans_SC({ 
  subsets: ['latin'], 
  weight: ['300', '400', '500', '700'],
  variable: '--font-noto-sans',
  display: 'swap',
});

const crimsonPro = Crimson_Pro({ 
  subsets: ['latin'], 
  variable: '--font-crimson',
  display: 'swap',
});

const notoSerifSC = Noto_Serif_SC({ 
  subsets: ['latin'],
  weight: ['400', '500', '700'], 
  variable: '--font-noto-serif',
  display: 'swap',
});

const playfair = Playfair_Display({ 
  subsets: ['latin'], 
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "AgentifUI",
  description: "企业级大模型应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // --- BEGIN COMMENT ---
  // 🎯 组合所有字体变量类名，确保在整个应用中可用
  // --- END COMMENT ---
  const fontClasses = cn(
    inter.variable,
    notoSansSC.variable,
    crimsonPro.variable,
    notoSerifSC.variable,
    playfair.variable
  );

  return (
    <html lang="zh-CN" className={fontClasses} suppressHydrationWarning>
      <head>
        {/* Removed the manually added theme initialization script */}
        {/* Let next-themes handle the initial theme setting */}
      </head>
      <body>
        <Providers> { /* 使用 Providers 包裹 */ }
          {/* 添加 DynamicTitle 组件，确保它能在所有页面中生效 */}
          <DynamicTitle />
          <ClientLayout fontClasses={fontClasses}>
            {children}
            <TooltipContainer />
            <NotificationBar />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--toast-text)',
                  border: '1px solid var(--toast-border)',
                  fontFamily: 'var(--font-noto-serif)',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
          </ClientLayout>
        </Providers>
        {process.env.ENABLE_STAGEWISE_TOOLBAR === "true" && process.env.NODE_ENV === "development" && <StagewiseToolbarWrapper />}
      </body>
    </html>
  );
}
