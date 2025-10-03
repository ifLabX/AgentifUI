-- Create dynamic_pages table for managing custom routes
CREATE TABLE IF NOT EXISTS dynamic_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE, -- Route path like '/contact', '/services/consulting'
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Constraint: slug must start with '/'
  CONSTRAINT valid_slug_format CHECK (slug ~ '^/[a-zA-Z0-9/_-]+$')
);

-- Create index on slug for faster lookups
CREATE INDEX idx_dynamic_pages_slug ON dynamic_pages(slug);
CREATE INDEX idx_dynamic_pages_published ON dynamic_pages(is_published);

-- Enable RLS
ALTER TABLE dynamic_pages ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published pages
CREATE POLICY "Public can view published pages"
  ON dynamic_pages
  FOR SELECT
  USING (is_published = true);

-- Allow admins to manage all pages
CREATE POLICY "Admins can manage dynamic pages"
  ON dynamic_pages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dynamic_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER trigger_update_dynamic_pages_updated_at
  BEFORE UPDATE ON dynamic_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_dynamic_pages_updated_at();

-- Add comment for documentation
COMMENT ON TABLE dynamic_pages IS 'Stores custom dynamic page routes created by admins';
COMMENT ON COLUMN dynamic_pages.slug IS 'URL path like /contact or /services/consulting';
COMMENT ON COLUMN dynamic_pages.is_published IS 'Whether the page is publicly accessible';
