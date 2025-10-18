-- Create discovery_pages table for custom page management in discovery section
-- Allows admins to add custom pages with routes and content
-- Timestamp: 20251018000000

-- --- BEGIN COMMENT ---
-- 1. Create discovery_pages table
-- --- END COMMENT ---
CREATE TABLE IF NOT EXISTS public.discovery_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  route TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT, -- lucide icon name (e.g., 'FileText', 'BookOpen')
  content JSONB, -- flexible content structure for future use
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Ensure route starts with '/' and is lowercase
  CONSTRAINT valid_route CHECK (route ~ '^/[a-z0-9\-/]+$')
);

-- --- BEGIN COMMENT ---
-- 2. Create indexes for performance
-- --- END COMMENT ---
CREATE INDEX IF NOT EXISTS idx_discovery_pages_route ON public.discovery_pages(route);
CREATE INDEX IF NOT EXISTS idx_discovery_pages_is_active ON public.discovery_pages(is_active);
CREATE INDEX IF NOT EXISTS idx_discovery_pages_display_order ON public.discovery_pages(display_order);
CREATE INDEX IF NOT EXISTS idx_discovery_pages_created_at ON public.discovery_pages(created_at DESC);

-- --- BEGIN COMMENT ---
-- 3. Create updated_at trigger
-- --- END COMMENT ---
CREATE OR REPLACE FUNCTION public.update_discovery_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_discovery_pages_updated_at
  BEFORE UPDATE ON public.discovery_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_discovery_pages_updated_at();

-- --- BEGIN COMMENT ---
-- 4. Enable Row Level Security (RLS)
-- --- END COMMENT ---
ALTER TABLE public.discovery_pages ENABLE ROW LEVEL SECURITY;

-- --- BEGIN COMMENT ---
-- 5. Create RLS policies
-- All authenticated users can read active pages
-- Only admins can create, update, and delete pages
-- --- END COMMENT ---

-- Select policy: all authenticated users can view active pages
CREATE POLICY "discovery_pages_select_policy" ON public.discovery_pages
FOR SELECT USING (
  auth.uid() IS NOT NULL
  AND (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
);

-- Insert policy: only admins can create pages
CREATE POLICY "discovery_pages_insert_policy" ON public.discovery_pages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Update policy: only admins can update pages
CREATE POLICY "discovery_pages_update_policy" ON public.discovery_pages
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Delete policy: only admins can delete pages
CREATE POLICY "discovery_pages_delete_policy" ON public.discovery_pages
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- --- BEGIN COMMENT ---
-- 6. Verify table creation results
-- --- END COMMENT ---
DO $$
DECLARE
  table_exists BOOLEAN;
  policy_count INTEGER;
  index_count INTEGER;
BEGIN
  -- Check if table exists
  SELECT EXISTS(
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'discovery_pages'
  ) INTO table_exists;

  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'discovery_pages';

  -- Count indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND tablename = 'discovery_pages';

  RAISE NOTICE '✅ Discovery pages table configuration completed';
  RAISE NOTICE '📊 Table "discovery_pages" exists: %', table_exists;
  RAISE NOTICE '🔒 Created % RLS policies', policy_count;
  RAISE NOTICE '🔍 Created % indexes', index_count;
  RAISE NOTICE '🎯 Admins can manage all pages, users can view active pages';
END $$;
