-- Add claim token fields to alumni table to support profile claiming
ALTER TABLE public.alumni 
ADD COLUMN IF NOT EXISTS profile_claimed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS claim_token TEXT,
ADD COLUMN IF NOT EXISTS claim_token_expires_at TIMESTAMPTZ;

-- Create index for faster claim token lookups
CREATE INDEX IF NOT EXISTS idx_alumni_claim_token ON public.alumni(claim_token) WHERE claim_token IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.alumni.claim_token IS 'Secure token for alumni to claim their imported profile';
