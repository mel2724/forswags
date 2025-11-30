-- SECURITY FIX: Migrate OAuth tokens to encrypted storage
-- This addresses the CRITICAL security finding for plaintext token storage

-- Step 1: Encrypt existing plaintext tokens using the existing encryption function
UPDATE connected_accounts
SET 
  encrypted_access_token = encrypt_oauth_token(access_token),
  encrypted_refresh_token = CASE 
    WHEN refresh_token IS NOT NULL THEN encrypt_oauth_token(refresh_token)
    ELSE NULL
  END
WHERE encrypted_access_token IS NULL;

-- Step 2: Make encrypted columns NOT NULL (after migration)
ALTER TABLE connected_accounts 
  ALTER COLUMN encrypted_access_token SET NOT NULL;

-- Step 3: Drop the plaintext columns (CRITICAL: removes security vulnerability)
ALTER TABLE connected_accounts 
  DROP COLUMN access_token,
  DROP COLUMN refresh_token;

-- Step 4: Add comment for documentation
COMMENT ON COLUMN connected_accounts.encrypted_access_token IS 'Encrypted OAuth access token using pgcrypto';
COMMENT ON COLUMN connected_accounts.encrypted_refresh_token IS 'Encrypted OAuth refresh token using pgcrypto';