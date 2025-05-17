import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "if-agent-ui",
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
          <ClientLayout fontClasses={`${geistSans.variable} ${geistMono.variable}`}>
            {children}
            <TooltipContainer />
            <NotificationBar />
          </ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
