-- Create table for connected social media accounts
CREATE TABLE IF NOT EXISTS public.connected_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'tiktok')),
  account_name TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Enable RLS
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for connected_accounts
CREATE POLICY "Users can view their own connected accounts"
  ON public.connected_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connected accounts"
  ON public.connected_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connected accounts"
  ON public.connected_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connected accounts"
  ON public.connected_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Create table for tracking post platform targets
CREATE TABLE IF NOT EXISTS public.post_platforms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'tiktok')),
  posted BOOLEAN NOT NULL DEFAULT false,
  platform_post_id TEXT,
  error_message TEXT,
  posted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, platform)
);

-- Enable RLS
ALTER TABLE public.post_platforms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_platforms
CREATE POLICY "Users can view platforms for their posts"
  ON public.post_platforms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.social_posts
      WHERE social_posts.id = post_platforms.post_id
      AND social_posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert platforms for their posts"
  ON public.post_platforms FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.social_posts
      WHERE social_posts.id = post_platforms.post_id
      AND social_posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update platforms for their posts"
  ON public.post_platforms FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.social_posts
      WHERE social_posts.id = post_platforms.post_id
      AND social_posts.user_id = auth.uid()
    )
  );

-- Create function to update connected_accounts updated_at
CREATE OR REPLACE FUNCTION public.update_connected_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for connected_accounts
CREATE TRIGGER update_connected_accounts_updated_at
  BEFORE UPDATE ON public.connected_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_connected_accounts_updated_at();