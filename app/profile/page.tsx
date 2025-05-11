'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ProfileForm } from '../../components/profile/profile-form';
import { createClient } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useTheme } from '@lib/hooks/use-theme';

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  updated_at: string | null;
  created_at: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // 使用直接的状态管理
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [pageError, setPageError] = useState<Error | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  
  // 确保客户端渲染一致性
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 根据主题获取颜色
  const getColors = () => {
    if (isDark) {
      return {
        bgColor: 'bg-stone-800',
        errorBg: 'bg-red-900',
        errorBorder: 'border-red-800',
        errorText: 'text-red-300',
        errorHeading: 'text-red-200',
        errorButton: 'bg-red-800 hover:bg-red-700 text-white',
        skeletonBg: 'bg-stone-700',
        titleGradient: 'from-stone-300 to-stone-500'
      };
    } else {
      return {
        bgColor: 'bg-stone-100',
        errorBg: 'bg-red-50',
        errorBorder: 'border-red-200',
        errorText: 'text-red-700',
        errorHeading: 'text-red-800',
        errorButton: 'bg-red-100 hover:bg-red-200 text-red-800',
        skeletonBg: 'bg-stone-200',
        titleGradient: 'from-stone-700 to-stone-900'
      };
    }
  };
  
  const colors = mounted ? getColors() : {
    bgColor: '',
    errorBg: '',
    errorBorder: '',
    errorText: '',
    errorHeading: '',
    errorButton: '',
    skeletonBg: '',
    titleGradient: ''
  };
  
  // 直接在页面级别获取数据，而不是通过 hook
  useEffect(() => {
    async function fetchProfileData() {
      try {
        setPageLoading(true);
        
        // 使用 Supabase 客户端获取用户信息
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return;
        }
        
        // 获取用户资料
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        // 设置资料数据
        setProfileData(data as Profile);
        
        // 等待一个短暂停，确保页面过渡平滑
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error('Failed to load profile:', err);
        setPageError(err instanceof Error ? err : new Error('加载资料失败'));
      } finally {
        setPageLoading(false);
      }
    }
    
    fetchProfileData();
  }, [router]);

  // 处理错误情况
  if (pageError) {
    return (
      <main className={`min-h-screen w-full flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${colors.bgColor}`}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className={`w-full rounded-xl p-6 border ${colors.errorBorder} ${colors.errorBg} ${colors.errorText}`}>
            <h2 className={`text-lg font-medium mb-4 ${colors.errorHeading}`}>加载资料时出错</h2>
            <p className="mb-6">{pageError.message}</p>
            <button 
              onClick={() => router.push('/login')} 
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${colors.errorButton} cursor-pointer hover:scale-105`}
            >
              返回登录
            </button>
          </div>
        </motion.div>
      </main>
    );
  }

  // 加载状态 - 使用骨架屏
  if (pageLoading) {
    return (
      <main className={`min-h-screen w-full flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${colors.bgColor}`}>
        <div className="w-full max-w-md">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="max-w-md w-full mx-auto p-4 space-y-6"
          >
            <div className={`h-8 w-1/3 mb-6 ${colors.skeletonBg} animate-pulse rounded-md`}></div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className={`h-4 w-1/4 ${colors.skeletonBg} animate-pulse rounded-md`}></div>
                <div className={`h-10 w-full ${colors.skeletonBg} animate-pulse rounded-md`}></div>
              </div>
              
              <div className="space-y-2">
                <div className={`h-4 w-1/4 ${colors.skeletonBg} animate-pulse rounded-md`}></div>
                <div className={`h-10 w-full ${colors.skeletonBg} animate-pulse rounded-md`}></div>
              </div>
              
              <div className={`h-10 w-full mt-6 ${colors.skeletonBg} animate-pulse rounded-md`}></div>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  // 数据加载完成，显示表单
  return (
    <main className={`min-h-screen w-full flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${colors.bgColor}`}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {profileData && <ProfileForm profileData={profileData} />}
      </motion.div>
    </main>
  );
}
