#!/usr/bin/env node

/**
 * Supabase 集成测试脚本
 * 
 * 这个脚本用于测试 Supabase 的连接、认证和基本功能
 * 使用方法: node test_supabase_integration.js
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const readline = require('readline');

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// 创建 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 创建命令行接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

// 测试 Supabase 连接
async function testConnection() {
  try {
    log('测试 Supabase 连接...', 'cyan');
    const { data, error } = await supabase.from('profiles').select('count');
    
    if (error) {
      log(`连接失败: ${error.message}`, 'red');
      return false;
    }
    
    log('Supabase 连接成功!', 'green');
    log(`URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`, 'green');
    return true;
  } catch (error) {
    log(`连接测试出错: ${error.message}`, 'red');
    return false;
  }
}

// 测试用户注册
async function testSignUp(email, password) {
  try {
    log(`尝试注册用户: ${email}...`, 'cyan');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      log(`注册失败: ${error.message}`, 'red');
      return false;
    }
    
    log('注册请求已发送!', 'green');
    log('请检查邮箱以完成注册流程', 'yellow');
    return true;
  } catch (error) {
    log(`注册测试出错: ${error.message}`, 'red');
    return false;
  }
}

// 测试用户登录
async function testSignIn(email, password) {
  try {
    log(`尝试登录用户: ${email}...`, 'cyan');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      log(`登录失败: ${error.message}`, 'red');
      return false;
    }
    
    log('登录成功!', 'green');
    log(`用户ID: ${data.user.id}`, 'green');
    log(`会话过期时间: ${new Date(data.session.expires_at * 1000).toLocaleString()}`, 'green');
    return data.session;
  } catch (error) {
    log(`登录测试出错: ${error.message}`, 'red');
    return false;
  }
}

// 测试获取用户资料
async function testGetProfile(session) {
  try {
    log('获取用户资料...', 'cyan');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (error) {
      log(`获取资料失败: ${error.message}`, 'red');
      return false;
    }
    
    log('获取资料成功!', 'green');
    log(JSON.stringify(data, null, 2), 'green');
    return true;
  } catch (error) {
    log(`获取资料测试出错: ${error.message}`, 'red');
    return false;
  }
}

// 测试登出
async function testSignOut() {
  try {
    log('尝试登出...', 'cyan');
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      log(`登出失败: ${error.message}`, 'red');
      return false;
    }
    
    log('登出成功!', 'green');
    return true;
  } catch (error) {
    log(`登出测试出错: ${error.message}`, 'red');
    return false;
  }
}

// 主菜单
function showMenu() {
  log('\n===== Supabase 集成测试 =====', 'magenta');
  log('1. 测试 Supabase 连接', 'yellow');
  log('2. 测试用户注册', 'yellow');
  log('3. 测试用户登录', 'yellow');
  log('4. 测试获取用户资料 (需要先登录)', 'yellow');
  log('5. 测试用户登出', 'yellow');
  log('0. 退出', 'yellow');
  log('============================', 'magenta');
  
  rl.question('请选择操作 (0-5): ', async (answer) => {
    switch (answer) {
      case '1':
        await testConnection();
        showMenu();
        break;
      case '2':
        rl.question('请输入邮箱: ', (email) => {
          rl.question('请输入密码: ', async (password) => {
            await testSignUp(email, password);
            showMenu();
          });
        });
        break;
      case '3':
        rl.question('请输入邮箱: ', (email) => {
          rl.question('请输入密码: ', async (password) => {
            const session = await testSignIn(email, password);
            if (session) {
              currentSession = session;
            }
            showMenu();
          });
        });
        break;
      case '4':
        if (!currentSession) {
          log('请先登录!', 'red');
          showMenu();
          break;
        }
        await testGetProfile(currentSession);
        showMenu();
        break;
      case '5':
        await testSignOut();
        currentSession = null;
        showMenu();
        break;
      case '0':
        log('再见!', 'magenta');
        rl.close();
        break;
      default:
        log('无效选择，请重试', 'red');
        showMenu();
    }
  });
}

// 全局会话变量
let currentSession = null;

// 开始测试
log('开始 Supabase 集成测试...', 'magenta');
log('确保您已经在 .env.local 文件中配置了正确的 Supabase URL 和 ANON KEY', 'yellow');
log('当前配置:', 'cyan');
log(`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`, 'cyan');
log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10)}...`, 'cyan');

showMenu();
