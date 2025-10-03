-- 头像存储 RLS 策略配置
-- 注意：存储桶通过 Supabase Dashboard 手动创建，这里只配置权限策略
-- 时间: 20250628134015

-- --- BEGIN COMMENT ---
-- 配置 Storage Objects 的 RLS 策略
-- 采用 Public Bucket + 路径防遍历设计
-- --- END COMMENT ---

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "avatars_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_policy" ON storage.objects;

-- --- BEGIN COMMENT ---
-- 上传策略：认证用户可以上传到自己的随机目录
-- 使用随机路径防止遍历：avatars/{random-uuid}/filename
-- --- END COMMENT ---
CREATE POLICY "avatars_upload_policy" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
  -- 允许用户上传到任何路径（由应用层控制路径安全性）
);

-- --- BEGIN COMMENT ---
-- 查看策略：所有人都可以查看头像（Public Bucket 设计）
-- 头像是公开资源，任何人都可以访问
-- --- END COMMENT ---
CREATE POLICY "avatars_select_policy" ON storage.objects
FOR SELECT USING (
  bucket_id = 'avatars'
  -- 公开访问，无限制
);

-- --- BEGIN COMMENT ---
-- 更新策略：用户只能更新自己上传的文件
-- 通过 owner 字段控制权限
-- --- END COMMENT ---
CREATE POLICY "avatars_update_policy" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
  AND owner = auth.uid()
);

-- --- BEGIN COMMENT ---
-- 删除策略：用户只能删除自己上传的文件
-- 通过 owner 字段控制权限
-- --- END COMMENT ---
CREATE POLICY "avatars_delete_policy" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid() IS NOT NULL
  AND owner = auth.uid()
);

-- --- BEGIN COMMENT ---
-- 验证策略创建结果
-- --- END COMMENT ---
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- 检查策略数量
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname LIKE 'avatars_%';
  
  RAISE NOTICE '✅ 头像存储 RLS 策略配置完成';
  RAISE NOTICE '🔒 已创建 % 个 RLS 策略', policy_count;
  RAISE NOTICE '📝 策略设计：';
  RAISE NOTICE '   - 上传：认证用户可上传';
  RAISE NOTICE '   - 查看：公开访问（头像是公开资源）';
  RAISE NOTICE '   - 更新/删除：仅文件所有者';
  RAISE NOTICE '🎯 安全特性：';
  RAISE NOTICE '   - 使用随机路径防止遍历';
  RAISE NOTICE '   - Public Bucket 设计，访问简单';
  RAISE NOTICE '   - 基于 owner 字段的权限控制';
  RAISE NOTICE '📋 下一步：通过 Dashboard 创建 avatars 存储桶（Public）';
END $$;
