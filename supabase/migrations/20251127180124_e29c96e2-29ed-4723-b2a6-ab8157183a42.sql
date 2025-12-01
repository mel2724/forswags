-- Add state column to oauth_state table for OAuth CSRF protection
ALTER TABLE oauth_state ADD COLUMN IF NOT EXISTS state TEXT;