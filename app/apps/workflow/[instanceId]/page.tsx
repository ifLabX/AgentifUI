"use client"

import React from 'react'
import { NavBar } from '@components/nav-bar'
import { WorkflowLayout } from '@components/workflow/workflow-layout'

interface WorkflowPageProps {
  params: Promise<{
    instanceId: string
  }>
}

/**
 * 工作流应用页面
 * 
 * 功能特点：
 * - 基于 SSE 的实时工作流执行
 * - 动态输入表单（基于 user_input_form 配置）
 * - 细粒度节点状态跟踪
 * - 执行历史记录管理
 * - 响应式设计，支持移动端
 * - 统一 stone 色系主题
 */
export default function WorkflowPage({ params }: WorkflowPageProps) {
  const { instanceId } = React.use(params)
  
  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-800">
      {/* --- 顶部导航栏 --- */}
      <NavBar />
      
      {/* --- 主内容区域，为 NavBar 留出空间 --- */}
      <div className="pt-12">
        <WorkflowLayout instanceId={instanceId} />
      </div>
    </div>
  )
} 