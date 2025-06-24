'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@components/ui/button';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@lib/supabase/client';
import { useTheme } from '@lib/hooks/use-theme';
import { AdminButton } from '@components/admin/admin-button';

export function Home() {
  const router = useRouter();
  const { isDark } = useTheme();
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<any>(null);

  const handleStartClick = async () => {
    try {
      // 检查用户是否已登录
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // 用户已登录，直接跳转到聊天页面
        router.push('/chat');
      } else {
        // 用户未登录，跳转到登录页面
        router.push('/login');
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
      // 出错时默认跳转到登录页面
      router.push('/login');
    }
  };

  const handleLearnMoreClick = () => {
    router.push('/about');
  };

  // 根据主题获取颜色
  const getColors = () => {
    if (isDark) {
      return {
        titleGradient: 'from-stone-300 to-stone-500',
        textColor: 'text-gray-300',
        cardBg: 'bg-stone-700',
        cardBorder: 'border-stone-600',
        cardShadow: 'shadow-[0_4px_20px_rgba(0,0,0,0.3)]',
        primaryButton: 'bg-stone-600 hover:bg-stone-500 text-gray-100',
        secondaryButton: 'border-stone-500 text-gray-200 hover:bg-stone-600',
        featureIconBg: 'bg-stone-600',
        featureTextColor: 'text-gray-300'
      };
    } else {
      return {
        titleGradient: 'from-stone-700 to-stone-900',
        textColor: 'text-stone-700',
        cardBg: 'bg-stone-100',
        cardBorder: 'border-stone-200',
        cardShadow: 'shadow-[0_4px_20px_rgba(0,0,0,0.1)]',
        primaryButton: 'bg-stone-800 hover:bg-stone-700 text-gray-100',
        secondaryButton: 'border-stone-400 text-stone-800 hover:bg-stone-200',
        featureIconBg: 'bg-stone-200',
        featureTextColor: 'text-stone-700'
      };
    }
  };

  const colors = getColors();

  useEffect(() => {
    const getCurrentUser = async () => {
      // 🔒 安全修复：使用 getUser() 进行服务器端验证
      // 避免依赖可能被篡改的本地 session 数据
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };

    getCurrentUser();
  }, []);

  return (
    <AnimatePresence>
      <div className="w-full py-12 px-4 sm:px-6 lg:px-8 relative">
        {/* --- BEGIN COMMENT ---
        管理员入口按钮，仅对管理员用户显示
        --- END COMMENT --- */}
        <AdminButton variant="floating" />

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          {/* 主标题区域 */}
          <div className="text-center mb-16">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className={`text-5xl md:text-6xl font-bold bg-gradient-to-r ${colors.titleGradient} bg-clip-text text-transparent mb-6 leading-tight py-2`}
            >
              AgentifUI
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={`text-xl md:text-2xl ${colors.textColor} max-w-3xl mx-auto font-light`}
            >
              探索AI的无限可能，打造智能新体验
            </motion.p>
          </div>
          
          {/* 特性卡片区域 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
          >
            {[
              { title: "多模型支持", description: "兼容多种主流大语言模型，支持API接入与本地化部署，满足不同算力与使用场景需求。" },
              { title: "能力融合平台", description: "集成问答、数据分析、应用交互等能力，构建统一的智能服务框架，支持插件与工作流扩展。" },
              { title: "高教场景优化", description: "聚焦高等教育需求，融合教学、科研与管理场景，提升教育数字化服务水平与智能化体验。" }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                className={`${colors.cardBg} ${colors.cardShadow} border ${colors.cardBorder} rounded-xl p-6 flex flex-col items-center text-center`}
              >
                <div className={`${colors.featureIconBg} w-12 h-12 rounded-full flex items-center justify-center mb-4`}>
                  <span className="text-xl">#{index + 1}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className={`${colors.featureTextColor} text-sm`}>{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
          
          {/* 按钮区域 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Button 
              size="lg" 
              className={`${colors.primaryButton} px-8 py-3 h-auto text-base font-medium rounded-lg transition-all duration-200 cursor-pointer hover:scale-105`}
              onClick={handleStartClick}
            >
              立即开始
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className={`${colors.secondaryButton} px-8 py-3 h-auto text-base font-medium rounded-lg transition-all duration-200 cursor-pointer hover:scale-105`}
              onClick={handleLearnMoreClick}
            >
              了解更多
            </Button>
          </motion.div>
          
          {/* 底部信息 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className={`text-center ${colors.textColor} text-sm`}
          >
            <p>
              © <span suppressHydrationWarning>{new Date().getFullYear()}</span> AgentifUI. 探索AI的无限可能。
            </p>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}