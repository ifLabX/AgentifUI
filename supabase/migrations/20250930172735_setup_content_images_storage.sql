-- Setup content images storage for admin content editor
-- Create content-images bucket with RLS policies
-- Timestamp: 20250930172735

-- --- BEGIN COMMENT ---
-- 1. Create content-images storage bucket (if not exists)
-- --- END COMMENT ---
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-images',
  'content-images',
  true,
  10485760, -- 10MB = 10 * 1024 * 1024 bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- --- BEGIN COMMENT ---
-- 2. Create RLS policies for Storage Objects
-- Allow authenticated users to upload, view, and delete content images
-- --- END COMMENT ---

-- Drop existing policies if any
DROP POLICY IF EXISTS "content_images_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "content_images_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "content_images_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "content_images_delete_policy" ON storage.objects;

-- Upload policy: authenticated users can upload to their own directory
CREATE POLICY "content_images_upload_policy" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'content-images'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = CONCAT('user-', auth.uid()::text)
);

-- Select policy: everyone can view content images (public bucket)
CREATE POLICY "content_images_select_policy" ON storage.objects
FOR SELECT USING (
  bucket_id = 'content-images'
);

-- Update policy: users can only update their own content images
CREATE POLICY "content_images_update_policy" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'content-images'
  AND auth.uid() = owner
);

-- Delete policy: users can only delete their own content images
CREATE POLICY "content_images_delete_policy" ON storage.objects
FOR DELETE USING (
  bucket_id = 'content-images'
  AND auth.uid() = owner
);

-- --- BEGIN COMMENT ---
-- 3. Verify policy creation results
-- --- END COMMENT ---
DO $$
DECLARE
  bucket_exists BOOLEAN;
  policy_count INTEGER;
BEGIN
  -- Check if bucket exists
  SELECT EXISTS(
    SELECT 1 FROM storage.buckets WHERE id = 'content-images'
  ) INTO bucket_exists;

  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'content_images_%';

  RAISE NOTICE '✅ Content images storage bucket configuration completed';
  RAISE NOTICE '📁 Bucket "content-images" exists: %', bucket_exists;
  RAISE NOTICE '🔒 Created % RLS policies', policy_count;
  RAISE NOTICE '🎯 Supported formats: JPEG, PNG, WebP, GIF';
  RAISE NOTICE '📏 Maximum file size: 10MB';
  RAISE NOTICE '🌐 Public access: enabled';
END $$;