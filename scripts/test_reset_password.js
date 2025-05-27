#!/usr/bin/env node

/**
 * 重置密码功能测试脚本
 * 用于验证忘记密码和重置密码的完整流程
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// --- 颜色输出函数 ---
function log(message, color = 'white') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// --- 初始化Supabase客户端 ---
let supabase;

function initSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    log('❌ 缺少Supabase环境变量:', 'red');
    log('请确保设置了 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY', 'red');
    process.exit(1);
  }
  
  supabase = createClient(url, key);
  log('✅ Supabase客户端初始化成功', 'green');
}

// --- 读取环境变量 ---
require('dotenv').config({ path: '.env.local' });

// --- 创建readline接口 ---
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// --- 测试发送重置密码邮件 ---
async function testForgotPassword(email) {
  try {
    log(`\n正在为邮箱 ${email} 发送重置密码邮件...`, 'cyan');
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `http://localhost:3000/reset-password`,
    });
    
    if (error) {
      log(`❌ 发送失败: ${error.message}`, 'red');
      return false;
    }
    
    log('✅ 重置密码邮件发送成功!', 'green');
    log('📧 请检查邮箱收件箱中的重置链接', 'yellow');
    log('🔗 链接格式: http://localhost:3000/reset-password?access_token=...', 'blue');
    return true;
  } catch (error) {
    log(`❌ 发送重置邮件时出错: ${error.message}`, 'red');
    return false;
  }
}

// --- 测试用户注册（用于创建测试账户）---
async function testSignUp(email, password) {
  try {
    log(`\n正在注册测试账户: ${email}...`, 'cyan');
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      if (error.message.includes('already registered')) {
        log('ℹ️ 用户已存在，可以直接测试重置密码', 'blue');
        return true;
      }
      log(`❌ 注册失败: ${error.message}`, 'red');
      return false;
    }
    
    log('✅ 测试账户注册成功!', 'green');
    return true;
  } catch (error) {
    log(`❌ 注册时出错: ${error.message}`, 'red');
    return false;
  }
}

// --- 检查Auth配置 ---
async function checkAuthConfig() {
  try {
    log('\n🔍 检查Auth配置...', 'magenta');
    
    // 尝试获取会话信息
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      log('⚠️ 获取用户信息失败，但这在测试中是正常的', 'yellow');
    } else if (user) {
      log(`ℹ️ 当前登录用户: ${user.email}`, 'blue');
    } else {
      log('ℹ️ 当前无用户登录', 'blue');
    }
    
    log('✅ Auth配置检查完成', 'green');
    return true;
  } catch (error) {
    log(`❌ Auth配置检查失败: ${error.message}`, 'red');
    return false;
  }
}

// --- 显示菜单 ---
function showMenu() {
  log('\n====== 重置密码功能测试工具 ======', 'magenta');
  log('1. 检查Auth配置', 'yellow');
  log('2. 注册测试账户', 'yellow');
  log('3. 发送重置密码邮件', 'yellow');
  log('4. 完整测试流程', 'yellow');
  log('0. 退出', 'yellow');
  log('==================================', 'magenta');
  
  rl.question('请选择操作 (0-4): ', (answer) => {
    switch (answer) {
      case '1':
        checkAuthConfig().then(() => showMenu());
        break;
      case '2':
        rl.question('请输入测试邮箱: ', (email) => {
          rl.question('请输入测试密码: ', (password) => {
            testSignUp(email, password).then(() => showMenu());
          });
        });
        break;
      case '3':
        rl.question('请输入要重置密码的邮箱: ', (email) => {
          testForgotPassword(email).then(() => showMenu());
        });
        break;
      case '4':
        rl.question('请输入测试邮箱: ', (email) => {
          rl.question('请输入测试密码: ', async (password) => {
            log('\n🚀 开始完整测试流程...', 'magenta');
            
            // 步骤1: 确保有测试账户
            const signUpSuccess = await testSignUp(email, password);
            if (!signUpSuccess) {
              showMenu();
              return;
            }
            
            // 步骤2: 发送重置密码邮件
            const resetSuccess = await testForgotPassword(email);
            if (resetSuccess) {
              log('\n✅ 完整测试流程执行成功!', 'green');
              log('📋 接下来请手动测试:', 'blue');
              log('   1. 检查邮箱中的重置链接', 'blue');
              log('   2. 点击链接跳转到重置密码页面', 'blue');
              log('   3. 输入新密码并提交', 'blue');
              log('   4. 验证是否可以用新密码登录', 'blue');
            }
            
            showMenu();
          });
        });
        break;
      case '0':
        log('再见! 👋', 'green');
        rl.close();
        process.exit(0);
        break;
      default:
        log('无效的选择，请重试', 'red');
        showMenu();
    }
  });
}

// --- 主函数 ---
function main() {
  log('🔐 重置密码功能测试工具', 'magenta');
  log('===========================', 'magenta');
  
  try {
    initSupabase();
    showMenu();
  } catch (error) {
    log(`❌ 初始化失败: ${error.message}`, 'red');
    process.exit(1);
  }
}

// --- 启动程序 ---
if (require.main === module) {
  main();
}

module.exports = {
  testForgotPassword,
  testSignUp,
  checkAuthConfig
}; 