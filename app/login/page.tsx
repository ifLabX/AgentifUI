'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LoginForm } from '@components/auth/login-form';
import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { useTheme } from '@lib/hooks/use-theme';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');
  const resetSuccess = searchParams.get('reset');
  const oauthError = searchParams.get('error');
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // 确保客户端渲染一致性
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 根据主题获取颜色
  const getColors = () => {
    if (isDark) {
      return {
        bgColor: 'bg-stone-800',
        alertBg: 'bg-stone-800/50',
        alertBorder: 'border-stone-600',
        alertText: 'text-stone-300',
        iconColor: 'text-stone-400',
        errorAlertBg: 'bg-red-900/30',
        errorAlertBorder: 'border-red-500',
        errorAlertText: 'text-red-400',
        errorIconColor: 'text-red-400'
      };
    } else {
      return {
        bgColor: 'bg-stone-100',
        alertBg: 'bg-stone-50',
        alertBorder: 'border-stone-300',
        alertText: 'text-stone-700',
        iconColor: 'text-stone-600',
        errorAlertBg: 'bg-red-50',
        errorAlertBorder: 'border-red-500',
        errorAlertText: 'text-red-700',
        errorIconColor: 'text-red-500'
      };
    }
  };
  
  const colors = mounted ? getColors() : {
    bgColor: '',
    alertBg: '',
    alertBorder: '',
    alertText: '',
    iconColor: '',
    errorAlertBg: '',
    errorAlertBorder: '',
    errorAlertText: '',
    errorIconColor: ''
  };

  // 获取错误消息
  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'oauth_failed':
        return 'OAuth登录失败，请重试或使用其他登录方式';
      case 'sso_callback_failed':
        return 'SSO认证回调处理失败，请重新尝试登录';
      case 'ticket_validation_failed':
        return 'SSO票据验证失败，请重新登录';
      case 'invalid_employee_number':
        return '学工号格式不正确，请联系管理员';
      case 'user_creation_failed':
        return '账户创建失败，请联系管理员';
      case 'sso_provider_not_found':
        return 'SSO服务配置错误，请联系管理员';
      case 'missing_ticket':
        return '认证参数缺失，请重新登录';
      default:
        return '登录过程中出现错误，请稍后重试';
    }
  };

  return (
    <main className={`min-h-screen w-full flex flex-col items-center justify-center gap-4 py-12 px-4 sm:px-6 lg:px-8 ${colors.bgColor} font-serif`}>
      {registered && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Alert className={`max-w-md border-l-4 ${colors.alertBg} ${colors.alertBorder}`}>
            <CheckCircle className={`h-4 w-4 ${colors.iconColor}`} />
            <AlertDescription className={`${colors.alertText} font-serif`}>
              注册成功！请查看您的邮箱以验证账户，然后登录。
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
      {resetSuccess === 'success' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Alert className={`max-w-md border-l-4 ${colors.alertBg} ${colors.alertBorder}`}>
            <CheckCircle className={`h-4 w-4 ${colors.iconColor}`} />
            <AlertDescription className={`${colors.alertText} font-serif`}>
              密码重置成功！请使用新密码登录。
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
      {oauthError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Alert className={`max-w-md border-l-4 ${colors.errorAlertBg} ${colors.errorAlertBorder}`}>
            <AlertTriangle className={`h-4 w-4 ${colors.errorIconColor}`} />
            <AlertDescription className={`${colors.errorAlertText} font-serif`}>
              {getErrorMessage(oauthError)}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <LoginForm />
      </motion.div>
    </main>
  );
}