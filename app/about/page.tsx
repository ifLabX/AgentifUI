"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@components/ui/button';
import { createClient } from '@lib/supabase/client';

export default function AboutPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // 处理"开始探索"按钮点击
  const handleExploreClick = async () => {
    setIsLoading(true);
    try {
      // 检查用户是否已登录
      const supabase = createClient();
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center py-16 px-4 md:px-8 overflow-auto">
      <div className="max-w-4xl w-full space-y-12">
        <section className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            关于 LLM-EduHub
          </h1>
          <p className="mt-6 text-xl text-gray-600">
            连接 AI 与教育，打造未来学习新体验
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">我们的使命</h2>
          <p className="text-lg text-gray-700">
            LLM-EduHub 致力于利用大型语言模型的力量，为学生、教师和教育机构提供创新的学习体验和工具。
            我们相信，AI 辅助教育可以为每个人创造更加个性化、高效和平等的学习机会。
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">我们的价值观</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-blue-600">平等获取教育</h3>
              <p className="mt-2 text-gray-700">
                我们致力于消除教育差距，让每个学习者都能获得高质量的学习资源。
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-blue-600">个性化学习</h3>
              <p className="mt-2 text-gray-700">
                我们通过 AI 技术，打造适应每个学习者特点的个性化学习路径。
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-blue-600">创新与实用</h3>
              <p className="mt-2 text-gray-700">
                我们追求教育技术的创新，同时确保它们真正满足教育实践的需求。
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-blue-600">数据安全与隐私</h3>
              <p className="mt-2 text-gray-700">
                我们严格保护用户数据，确保学习过程的安全和隐私。
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">加入我们</h2>
          <p className="text-lg text-gray-700">
            我们邀请教育工作者、开发者和对教育科技有热情的人士加入我们，共同探索 AI 教育的新边界。
          </p>
          <div className="flex justify-center">
            <Button 
              size="lg" 
              variant="gradient" 
              className="px-8 py-6 h-auto text-base font-medium"
              onClick={handleExploreClick}
              isLoading={isLoading}
            >
              开始探索
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
} 