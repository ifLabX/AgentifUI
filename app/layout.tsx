import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { TooltipContainer } from "@components/ui/tooltip";
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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Removed the manually added theme initialization script */}
        {/* Let next-themes handle the initial theme setting */}
      </head>
      <body>
        <Providers> { /* 使用 Providers 包裹 */ }
          {/* 添加 DynamicTitle 组件，确保它能在所有页面中生效 */}
          <DynamicTitle />
          <ClientLayout fontClasses={geistSans.variable}>
            {children}
            <TooltipContainer />
            <NotificationBar />
          </ClientLayout>
        </Providers>
        {process.env.ENABLE_STAGEWISE_TOOLBAR === "true" && process.env.NODE_ENV === "development" && <StagewiseToolbarWrapper />}
        {process.env.ENABLE_DIFY_IFRAME === "true" && process.env.NODE_ENV === "development" && (
          <>
            {/* --- BEGIN COMMENT ---
              Dify 聊天小窗脚本与样式，仅在客户端渲染，避免 SSR 报错。
              - window 相关操作需在浏览器端执行
              - 使用 next/script 保证安全插入
            --- END COMMENT --- */}
            <style>{`
              #dify-chatbot-bubble-button {
                background-color: #1C64F2 !important;
              }
              #dify-chatbot-bubble-window {
                width: 24rem !important;
                height: 40rem !important;
              }
            `}</style>
            {/* 使用 next/script 动态插入脚本，防止 SSR 报错 */}
            <script
              dangerouslySetInnerHTML={{
                __html: `window.difyChatbotConfig = { token: 'urziAMc7a6bhScA3', systemVariables: {} };`
              }}
            />
            <script
              src="https://udify.app/embed.min.js"
              id="urziAMc7a6bhScA3"
              defer
            />
          </>
        )}
      </body>
    </html>
  );
}
