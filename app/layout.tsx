import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipContainer } from "@components/ui/tooltip";
import "./globals.css";
import "../styles/markdown-variables.css";
import "../styles/markdown.css";
import "../styles/prism-custom.css"; // 导入自定义Prism样式
import { NotificationBar } from '@components/ui/notification-bar';
import { ThemeProvider } from "next-themes";
import { ClientLayout } from "./layouts/client-layout";
import { cn } from "@lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LLM-EduHub",
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
        {/* Restore defaultTheme and enableSystem props for ThemeProvider */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClientLayout fontClasses={`${geistSans.variable} ${geistMono.variable}`}>
            {children}
            <TooltipContainer />
            <NotificationBar />
          </ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
