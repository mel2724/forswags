-- Create oauth_state table for storing OAuth flow state
CREATE TABLE IF NOT EXISTS public.oauth_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  code_verifier TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.oauth_state ENABLE ROW LEVEL SECURITY;

-- Users can manage their own OAuth state
CREATE POLICY "Users can manage their own oauth state"
ON public.oauth_state
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX idx_oauth_state_user_platform ON public.oauth_state(user_id, platform);