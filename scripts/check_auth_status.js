#!/usr/bin/env node

/**
 * Supabase 认证状态检查脚本
 * 
 * 这个脚本用于检查当前的 Supabase 认证状态
 * 使用方法: node check_auth_status.js
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

// 创建命令行接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 检查认证状态
async function checkAuthStatus() {
  log('====== Supabase 认证状态检查 ======', 'magenta');
  
  try {
    // 获取当前会话
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      log(`获取会话失败: ${sessionError.message}`, 'red');
      return;
    }
    
    if (session) {
      log('当前已登录', 'green');
      log(`用户ID: ${session.user.id}`, 'green');
      log(`邮箱: ${session.user.email}`, 'green');
      log(`上次登录时间: ${new Date(session.user.last_sign_in_at).toLocaleString()}`, 'green');
      
      // 获取用户资料
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profileError) {
        log(`获取用户资料失败: ${profileError.message}`, 'red');
      } else if (profile) {
        log('\n用户资料:', 'cyan');
        log(`姓名: ${profile.full_name || '未设置'}`, 'cyan');
        log(`用户名: ${profile.username || '未设置'}`, 'cyan');
        log(`网站: ${profile.website || '未设置'}`, 'cyan');
        log(`头像URL: ${profile.avatar_url || '未设置'}`, 'cyan');
      } else {
        log('\n用户资料不存在，这可能是个问题', 'yellow');
      }
    } else {
      log('当前未登录', 'yellow');
    }
  } catch (error) {
    log(`检查认证状态出错: ${error.message}`, 'red');
  }
  
  log('\n====== 检查完成 ======', 'magenta');
}

// 显示菜单
function showMenu() {
  log('\n===== Supabase 认证工具 =====', 'magenta');
  log('1. 检查当前认证状态', 'yellow');
  log('2. 登录', 'yellow');
  log('3. 注册', 'yellow');
  log('4. 登出', 'yellow');
  log('0. 退出', 'yellow');
  log('============================', 'magenta');
  
  rl.question('请选择操作 (0-4): ', (answer) => {
    switch (answer) {
      case '1':
        checkAuthStatus().then(() => showMenu());
        break;
      case '2':
        rl.question('请输入邮箱: ', (email) => {
          rl.question('请输入密码: ', async (password) => {
            try {
              log('正在登录...', 'cyan');
              const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
              });
              
              if (error) {
                log(`登录失败: ${error.message}`, 'red');
              } else {
                log('登录成功!', 'green');
              }
            } catch (error) {
              log(`登录出错: ${error.message}`, 'red');
            }
            showMenu();
          });
        });
        break;
      case '3':
        rl.question('请输入邮箱: ', (email) => {
          rl.question('请输入密码: ', async (password) => {
            try {
              log('正在注册...', 'cyan');
              const { data, error } = await supabase.auth.signUp({
                email,
                password,
              });
              
              if (error) {
                log(`注册失败: ${error.message}`, 'red');
              } else {
                log('注册请求已发送!', 'green');
                log('请检查邮箱以完成注册流程', 'yellow');
              }
            } catch (error) {
              log(`注册出错: ${error.message}`, 'red');
            }
            showMenu();
          });
        });
        break;
      case '4':
        (async () => {
          try {
            log('正在登出...', 'cyan');
            const { error } = await supabase.auth.signOut();
            
            if (error) {
              log(`登出失败: ${error.message}`, 'red');
            } else {
              log('登出成功!', 'green');
            }
          } catch (error) {
            log(`登出出错: ${error.message}`, 'red');
          }
          showMenu();
        })();
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

// 启动工具
log('Supabase 认证状态检查工具启动...', 'cyan');
showMenu();
