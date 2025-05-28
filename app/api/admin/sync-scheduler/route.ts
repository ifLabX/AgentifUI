import { NextRequest, NextResponse } from 'next/server'
import { syncScheduler } from '@lib/services/app-parameters-sync-scheduler'

/**
 * 同步调度器管理API
 * 
 * GET /api/admin/sync-scheduler - 获取调度器状态
 * POST /api/admin/sync-scheduler - 控制调度器（启动/停止/配置）
 */

// GET - 获取调度器状态
export async function GET() {
  try {
    const status = syncScheduler.getStatus()
    return NextResponse.json({ success: true, data: status })
  } catch (error) {
    console.error('获取调度器状态失败:', error)
    return NextResponse.json(
      { success: false, error: '获取状态失败' },
      { status: 500 }
    )
  }
}

// POST - 控制调度器
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, config } = body

    switch (action) {
      case 'start':
        syncScheduler.start()
        break
        
      case 'stop':
        syncScheduler.stop()
        break
        
      case 'configure':
        if (config) {
          syncScheduler.configure(config)
        }
        break
        
      case 'trigger':
        await syncScheduler.triggerSync()
        break
        
      case 'reset-stats':
        syncScheduler.resetStats()
        break
        
      default:
        return NextResponse.json(
          { success: false, error: '无效的操作' },
          { status: 400 }
        )
    }

    const status = syncScheduler.getStatus()
    return NextResponse.json({ success: true, data: status })
  } catch (error) {
    console.error('控制调度器失败:', error)
    return NextResponse.json(
      { success: false, error: '操作失败' },
      { status: 500 }
    )
  }
} 