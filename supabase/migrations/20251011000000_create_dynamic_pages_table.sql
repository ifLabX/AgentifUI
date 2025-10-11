-- Create dynamic_pages table for managing dynamic content pages
CREATE TABLE IF NOT EXISTS dynamic_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  titles JSONB DEFAULT '{}'::jsonb,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE dynamic_pages ENABLE ROW LEVEL SECURITY;

-- RLS policies for dynamic_pages
CREATE POLICY "Anyone can view published pages"
  ON dynamic_pages FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can view all pages"
  ON dynamic_pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert pages"
  ON dynamic_pages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update pages"
  ON dynamic_pages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete pages"
  ON dynamic_pages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dynamic_pages_slug ON dynamic_pages(slug);
CREATE INDEX IF NOT EXISTS idx_dynamic_pages_published ON dynamic_pages(is_published);
CREATE INDEX IF NOT EXISTS idx_dynamic_pages_created_at ON dynamic_pages(created_at DESC);

-- Update trigger
CREATE TRIGGER update_dynamic_pages_modtime
  BEFORE UPDATE ON dynamic_pages
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DO $$
BEGIN
  RAISE NOTICE '✅ dynamic_pages table created successfully';
  RAISE NOTICE '📋 Table supports dynamic content page management';
  RAISE NOTICE '🔒 RLS policies configured for admin and public access';
END $$;
