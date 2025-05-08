'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@components/ui/button';
import { createClient } from '../../lib/supabase/client';

interface ProfileFormProps {
  userId?: string;
}

export function ProfileForm({ userId }: ProfileFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profile, setProfile] = useState({
    full_name: '',
    username: '',
    website: '',
    avatar_url: '',
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        
        // 获取当前用户
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
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setProfile({
            full_name: data.full_name || '',
            username: data.username || '',
            website: data.website || '',
            avatar_url: data.avatar_url || '',
          });
        }
      } catch (error: any) {
        setMessage({
          type: 'error',
          text: error.message || '加载资料失败'
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadProfile();
  }, [router, supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setMessage(null);
      
      // 获取当前用户
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      // 更新用户资料
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          username: profile.username,
          website: profile.website,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString(),
        });
      
      if (error) {
        throw error;
      }
      
      setMessage({
        type: 'success',
        text: '资料已更新'
      });
      
      // 刷新页面数据
      router.refresh();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || '更新资料失败'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto">
      <h1 className="text-2xl font-bold mb-6">个人资料</h1>
      
      {message && (
        <div className={`p-4 mb-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium mb-1">
            姓名
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            value={profile.full_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-1">
            用户名
          </label>
          <input
            id="username"
            name="username"
            type="text"
            value={profile.username}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <div>
          <label htmlFor="website" className="block text-sm font-medium mb-1">
            网站
          </label>
          <input
            id="website"
            name="website"
            type="url"
            value={profile.website}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? '保存中...' : '保存资料'}
        </Button>
      </form>
    </div>
  );
}
