"use client";

import React from 'react';
import { cn } from '@lib/utils';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css";
import type { Components } from "react-markdown";
import { useTheme } from '@lib/hooks';
import { useThemeColors } from '@lib/hooks/use-theme-colors';
import { motion } from 'framer-motion'; // 仅导入 motion

/**
 * ThinkBlock 内容容器的属性接口
 */
interface ThinkBlockContentProps {
  // 要显示的 Markdown 内容
  markdownContent: string;
  // 控制内容是否显示
  isOpen: boolean; // 仍然需要这个属性，用于动画状态切换
}

/**
 * ThinkBlock 的内容显示容器
 * 使用 ReactMarkdown 渲染内容
 * 针对打开和关闭提供丝滑的动画效果
 */
export const ThinkBlockContent: React.FC<ThinkBlockContentProps> = ({ 
  markdownContent,
  isOpen 
}) => {
  const { isDark } = useTheme(); // 获取主题状态
  const { colors } = useThemeColors(); // 获取主题颜色

  // --- Markdown 渲染器的组件配置 ---
  const markdownComponents: Components = {
    code({ className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      // 如果不是带有语言标识的代码块 (inline code)
      return !className?.includes('language-') ? (
        <code className={cn(
          "px-2 py-1 rounded font-mono", 
          isDark ? "bg-stone-800 text-stone-300" : "bg-stone-100 text-stone-700"
        )} {...props}>
          {children}
        </code>
      ) : (
        // 如果是带有语言标识的代码块
        <pre className={cn(
          "rounded-md p-5 my-4 overflow-auto",
          isDark ? "bg-stone-900 text-stone-100" : "bg-stone-50 text-stone-900",
          "border",
          isDark ? "border-stone-700" : "border-stone-200"
        )}>
          <code className={cn(className, 'block whitespace-pre-wrap text-base')} {...props}>
            {children}
          </code>
        </pre>
      );
    },
    
    // 表格渲染
    table({ className, children, ...props }: any) {
      return (
        <div className="overflow-x-auto my-5 border rounded-md w-full">
          <table className={cn(
            "min-w-full divide-y",
            isDark ? "divide-stone-700 border-stone-700" : "divide-stone-200 border-stone-200"
          )} {...props}>
            {children}
          </table>
        </div>
      );
    },
    
    // 表头单元格样式
    th({ className, children, ...props }: any) {
      return (
        <th 
          className={cn(
            "px-5 py-3 text-left font-medium text-base", 
            isDark ? "bg-stone-900 text-stone-100" : "bg-stone-50 text-stone-900"
          )} 
          {...props}
        >
          {children}
        </th>
      );
    },
    
    // 表格数据单元格样式
    td({ className, children, ...props }: any) {
      return (
        <td 
          className={cn(
            "px-5 py-3 border-t text-base", 
            isDark ? "border-stone-700 text-stone-200" : "border-stone-200 text-stone-800"
          )} 
          {...props}
        >
          {children}
        </td>
      );
    },
    
    // 引用块样式
    blockquote({ className, children, ...props }: any) {
      return (
        <blockquote 
          className={cn(
            "pl-5 border-l-4 my-5 py-3", 
            isDark 
              ? "border-stone-600 bg-stone-800/80 text-stone-200" 
              : "border-stone-500 bg-stone-50 text-stone-800"
          )} 
          {...props}
        >
          {children}
        </blockquote>
      );
    },
    
    // 段落样式 - 完全去除段落间的间距，使其与普通换行一样
    p({ className, children, ...props }: any) {
      return (
        <p 
          className={cn(
            "my-0 text-base leading-relaxed", // 完全去除上下外边距
            isDark ? "text-gray-200" : "text-gray-800"
          )} 
          {...props}
        >
          {children}
        </p>
      );
    },
    
    // 标题样式
    h1({ className, children, ...props }: any) {
      return (
        <h1 
          className={cn(
            "text-2xl font-bold my-5",
            isDark ? colors.mainText.tailwind : "text-stone-900"
          )} 
          {...props}
        >
          {children}
        </h1>
      );
    },
    
    h2({ className, children, ...props }: any) {
      return (
        <h2 
          className={cn(
            "text-xl font-bold my-4",
            isDark ? colors.mainText.tailwind : "text-stone-800"
          )} 
          {...props}
        >
          {children}
        </h2>
      );
    },
    
    h3({ className, children, ...props }: any) {
      return (
        <h3 
          className={cn(
            "text-lg font-semibold my-3",
            isDark ? colors.mainText.tailwind : "text-stone-700"
          )} 
          {...props}
        >
          {children}
        </h3>
      );
    },
    
    // 列表样式
    ul({ className, children, ...props }: any) {
      return (
        <ul 
          className={cn(
            "my-4 pl-6 list-disc space-y-2 text-base",
            isDark ? "text-gray-200" : "text-gray-800"
          )} 
          {...props}
        >
          {children}
        </ul>
      );
    },
    
    ol({ className, children, ...props }: any) {
      return (
        <ol 
          className={cn(
            "my-4 pl-6 list-decimal space-y-2 text-base",
            isDark ? "text-gray-200" : "text-gray-800"
          )} 
          {...props}
        >
          {children}
        </ol>
      );
    },
    
    // 链接样式
    a({ className, children, ...props }: any) {
      return (
        <a 
          className={cn(
            "underline",
            isDark ? "text-stone-400 hover:text-stone-300" : "text-stone-600 hover:text-stone-800"
          )} 
          {...props}
        >
          {children}
        </a>
      );
    }
  };

  // --- 优化后的动画变体 ---
  const variants = {
    open: { 
      opacity: 1,
      height: "auto",
      scale: 1,
      y: 0,
      transition: {
        type: "spring", // 使用弹簧动画
        stiffness: 300, // 弹性系数
        damping: 24, // 阻尼系数，值越大动画越快结束
        mass: 0.8, // 质量，值越小动画越快
        height: { type: "spring", stiffness: 100, damping: 30 }, // 高度使用更缓和的弹簧
      }
    },
    closed: {
      opacity: 0,
      height: 0,
      scale: 0.95,
      y: -8,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25, 
        height: { delay: 0.1, type: "spring", stiffness: 200, damping: 30 }, // 稍延迟高度变化
      }
    }
  };

  return (
    <motion.div 
      className="overflow-hidden origin-top mb-2" // 添加 origin-top 并将 margin-bottom 移到这里
      initial={false} // 不使用 initial，避免首次渲染闪烁
      animate={isOpen ? "open" : "closed"} // 根据 isOpen 切换状态
      variants={variants}
    >
      <div
        id="think-block-content"
        className={cn(
          "think-block-content flex-1 markdown-body w-full",
          "border rounded-md", // 边框和圆角
          isDark ? "bg-stone-800/90 border-stone-700" : "bg-white border-stone-200", // 背景和边框颜色
          "p-5", // 内边距
          isDark ? colors.mainText.tailwind : "text-stone-900", // 文字颜色
          "font-sans text-base", // 字体
          "max-w-full", // 最大宽度
          "transform-gpu" // 启用GPU加速
        )}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          components={markdownComponents}
          children={markdownContent}
        />
      </div>
    </motion.div>
  );
};