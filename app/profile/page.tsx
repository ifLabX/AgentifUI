'use client';

import { useState, useEffect } from 'react';
import { ProfileForm } from '../../components/profile/profile-form';
import { createClient } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';

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
  // 使用直接的状态管理
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [pageError, setPageError] = useState<Error | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  
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
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          <h2 className="text-lg font-medium mb-2">加载资料时出错</h2>
          <p>{pageError.message}</p>
          <button 
            onClick={() => router.push('/login')} 
            className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
          >
            返回登录
          </button>
        </div>
      </main>
    );
  }

  // 加载状态 - 使用骨架屏
  if (pageLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md">
          <div className="max-w-md w-full mx-auto p-4 space-y-6">
            <div className="h-8 w-1/3 mb-6 bg-gray-200 animate-pulse rounded-md"></div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 w-1/4 bg-gray-200 animate-pulse rounded-md"></div>
                <div className="h-10 w-full bg-gray-200 animate-pulse rounded-md"></div>
              </div>
              
              <div className="space-y-2">
                <div className="h-4 w-1/4 bg-gray-200 animate-pulse rounded-md"></div>
                <div className="h-10 w-full bg-gray-200 animate-pulse rounded-md"></div>
              </div>
              
              <div className="h-10 w-full mt-6 bg-gray-200 animate-pulse rounded-md"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 数据加载完成，显示表单
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md">
        {profileData && <ProfileForm profileData={profileData} />}
      </div>
    </main>
  );
}
