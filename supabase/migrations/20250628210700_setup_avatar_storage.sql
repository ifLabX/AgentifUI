-- 配置头像存储功能
-- 创建 avatars 存储桶并设置 RLS 策略
-- 时间: 20250628210700

-- --- BEGIN COMMENT ---
-- 1. 创建 avatars 存储桶（如果不存在）
-- --- END COMMENT ---
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  5242880, -- 5MB = 5 * 1024 * 1024 bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- --- BEGIN COMMENT ---
-- 2. 创建 Storage Objects 的 RLS 策略
-- 允许认证用户上传、查看和删除自己的头像
-- --- END COMMENT ---

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "avatars_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_policy" ON storage.objects;

-- 上传策略：认证用户可以上传到自己的目录
CREATE POLICY "avatars_upload_policy" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = CONCAT('user-', auth.uid()::text)
);

-- 查看策略：所有人都可以查看头像（因为是公共存储桶）
CREATE POLICY "avatars_select_policy" ON storage.objects
FOR SELECT USING (
  bucket_id = 'avatars'
);

-- 更新策略：用户只能更新自己的头像
CREATE POLICY "avatars_update_policy" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = CONCAT('user-', auth.uid()::text)
);

-- 删除策略：用户只能删除自己的头像
CREATE POLICY "avatars_delete_policy" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = CONCAT('user-', auth.uid()::text)
);

-- --- BEGIN COMMENT ---
-- 3. 验证策略创建结果
-- --- END COMMENT ---
DO $$
DECLARE
  bucket_exists BOOLEAN;
  policy_count INTEGER;
BEGIN
  -- 检查存储桶是否存在
  SELECT EXISTS(
    SELECT 1 FROM storage.buckets WHERE id = 'avatars'
  ) INTO bucket_exists;
  
  -- 检查策略数量
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname LIKE 'avatars_%';
  
  RAISE NOTICE '✅ 头像存储桶配置完成';
  RAISE NOTICE '📁 存储桶 "avatars" 存在: %', bucket_exists;
  RAISE NOTICE '🔒 已创建 % 个 RLS 策略', policy_count;
  RAISE NOTICE '🎯 支持的格式: JPEG, PNG, WebP';
  RAISE NOTICE '📏 最大文件大小: 5MB';
  RAISE NOTICE '�� 公共访问: 启用';
END $$; 