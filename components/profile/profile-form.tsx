'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@components/ui/button';
import { createClient } from '../../lib/supabase/client';

interface ProfileData {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}

interface ProfileFormProps {
  profileData: ProfileData; // 直接接收已加载的数据
}

export function ProfileForm({ profileData }: ProfileFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profile, setProfile] = useState({
    full_name: profileData.full_name || '',
    username: profileData.username || '',
    avatar_url: profileData.avatar_url || '',
  });

  // 不再需要加载用户资料，因为数据已经通过 props 传入

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
      
      // 直接使用传入的 profileData.id
      // 更新用户资料
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: profileData.id, // 使用传入的 profileData.id
          full_name: profile.full_name,
          username: profile.username,
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
        
        <Button
          type="submit"
          disabled={loading}
          className="w-full mt-6"
        >
          {loading ? '正在保存...' : '保存修改'}
        </Button>
      </form>
    </div>
  );
}
