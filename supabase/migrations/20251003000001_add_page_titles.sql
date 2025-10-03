-- Add title column to store multi-language page titles
ALTER TABLE dynamic_pages ADD COLUMN IF NOT EXISTS titles JSONB DEFAULT '{}'::jsonb;

-- Add comment
COMMENT ON COLUMN dynamic_pages.titles IS 'Multi-language page titles in format {"en-US": "Help", "zh-CN": "帮助"}';

-- Update existing records to have empty titles object
UPDATE dynamic_pages SET titles = '{}'::jsonb WHERE titles IS NULL;
