-- Add thumbnail_url column to lessons table if it doesn't exist
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;