#!/usr/bin/env node

/**
 * Supabase 配置检查脚本
 * 
 * 这个脚本用于检查 Supabase 的配置和数据库结构
 * 使用方法: node check_supabase_config.js
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// 颜色函数
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// 打印带颜色的消息
function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

// 创建 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 检查 Supabase 配置
async function checkSupabaseConfig() {
  log('====== Supabase 配置检查 ======', 'magenta');
  
  // 检查环境变量
  log('\n1. 检查环境变量', 'cyan');
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    log('  ❌ NEXT_PUBLIC_SUPABASE_URL 未设置', 'red');
  } else {
    log(`  ✅ NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`, 'green');
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    log('  ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY 未设置', 'red');
  } else {
    log(`  ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10)}...`, 'green');
  }
  
  // 检查 Supabase 连接
  log('\n2. 检查 Supabase 连接', 'cyan');
  try {
    const { data, error } = await supabase.from('profiles').select('count');
    
    if (error) {
      log(`  ❌ 连接失败: ${error.message}`, 'red');
      if (error.message.includes('does not exist')) {
        log('  ❗ 可能是 profiles 表不存在，请检查数据库结构', 'yellow');
      }
    } else {
      log('  ✅ Supabase 连接成功', 'green');
    }
  } catch (error) {
    log(`  ❌ 连接测试出错: ${error.message}`, 'red');
  }
  
  // 检查数据库结构
  log('\n3. 检查数据库结构', 'cyan');
  try {
    // 检查 profiles 表
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      log(`  ❌ profiles 表检查失败: ${profilesError.message}`, 'red');
    } else {
      log('  ✅ profiles 表存在', 'green');
      
      // 检查 profiles 表结构
      if (profilesData && profilesData.length > 0) {
        const profile = profilesData[0];
        log('  ✅ profiles 表结构:', 'green');
        log(`    ${JSON.stringify(profile, null, 2)}`, 'green');
      } else {
        log('  ⚠️ profiles 表为空', 'yellow');
      }
    }
  } catch (error) {
    log(`  ❌ 数据库结构检查出错: ${error.message}`, 'red');
  }
  
  // 检查认证配置
  log('\n4. 检查认证配置', 'cyan');
  try {
    const { data: authSettings, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      log(`  ❌ 认证配置检查失败: ${authError.message}`, 'red');
    } else {
      log('  ✅ 认证配置正常', 'green');
      if (authSettings && authSettings.session) {
        log('  ✅ 当前有活跃会话', 'green');
      } else {
        log('  ⚠️ 当前没有活跃会话', 'yellow');
      }
    }
  } catch (error) {
    log(`  ❌ 认证配置检查出错: ${error.message}`, 'red');
  }
  
  // 检查现有用户
  log('\n5. 检查现有用户', 'cyan');
  log('  ⚠️ 需要管理员权限才能查看所有用户，这里只检查当前用户', 'yellow');
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      log(`  ❌ 用户检查失败: ${userError.message}`, 'red');
    } else if (user) {
      log('  ✅ 当前已登录用户:', 'green');
      log(`    ID: ${user.id}`, 'green');
      log(`    Email: ${user.email}`, 'green');
      log(`    Created At: ${user.created_at}`, 'green');
    } else {
      log('  ⚠️ 当前未登录任何用户', 'yellow');
    }
  } catch (error) {
    log(`  ❌ 用户检查出错: ${error.message}`, 'red');
  }
  
  log('\n====== 检查完成 ======', 'magenta');
}

// 运行检查
checkSupabaseConfig().catch(console.error);
