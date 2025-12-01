-- Create social_accounts table for multi-platform management
CREATE TABLE public.social_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'facebook', 'instagram', 'tiktok', 'linkedin')),
  username TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_posted_at TIMESTAMP WITH TIME ZONE,
  follower_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create scheduled_posts table for content calendar
CREATE TABLE public.scheduled_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'posted', 'failed', 'cancelled')),
  platforms TEXT[] NOT NULL DEFAULT '{}',
  template_type TEXT,
  hashtags TEXT[] DEFAULT '{}',
  posted_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create hashtag_performance table for tracking
CREATE TABLE public.hashtag_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hashtag TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'facebook', 'instagram', 'tiktok', 'linkedin')),
  post_id UUID REFERENCES public.scheduled_posts(id) ON DELETE CASCADE,
  impressions INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  used_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create post_templates table for templates library
CREATE TABLE public.post_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL CHECK (template_type IN ('offer', 'commitment', 'achievement', 'match', 'training', 'gameday', 'recruitment', 'custom')),
  content_template TEXT NOT NULL,
  suggested_hashtags TEXT[] DEFAULT '{}',
  graphic_config JSONB,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtag_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_accounts
CREATE POLICY "Users can view their own social accounts"
  ON public.social_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own social accounts"
  ON public.social_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social accounts"
  ON public.social_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social accounts"
  ON public.social_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for scheduled_posts
CREATE POLICY "Users can view their own scheduled posts"
  ON public.scheduled_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled posts"
  ON public.scheduled_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled posts"
  ON public.scheduled_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled posts"
  ON public.scheduled_posts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for hashtag_performance
CREATE POLICY "Users can view their own hashtag performance"
  ON public.hashtag_performance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own hashtag performance"
  ON public.hashtag_performance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hashtag performance"
  ON public.hashtag_performance FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for post_templates
CREATE POLICY "Users can view their own templates"
  ON public.post_templates FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create their own templates"
  ON public.post_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON public.post_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON public.post_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_social_accounts_user_id ON public.social_accounts(user_id);
CREATE INDEX idx_scheduled_posts_user_id ON public.scheduled_posts(user_id);
CREATE INDEX idx_scheduled_posts_scheduled_for ON public.scheduled_posts(scheduled_for);
CREATE INDEX idx_scheduled_posts_status ON public.scheduled_posts(status);
CREATE INDEX idx_hashtag_performance_user_id ON public.hashtag_performance(user_id);
CREATE INDEX idx_hashtag_performance_hashtag ON public.hashtag_performance(hashtag);
CREATE INDEX idx_post_templates_user_id ON public.post_templates(user_id);
CREATE INDEX idx_post_templates_type ON public.post_templates(template_type);

-- Create triggers for updated_at
CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_posts_updated_at
  BEFORE UPDATE ON public.scheduled_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_post_templates_updated_at
  BEFORE UPDATE ON public.post_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default public templates
INSERT INTO public.post_templates (name, description, template_type, content_template, suggested_hashtags, is_public) VALUES
  ('Game Day Hype', 'Announce your upcoming game', 'gameday', 'Game day! Ready to give it my all! {location} {time}', ARRAY['#GameDay', '#AthleteLife', '#ForSWAGsNation'], true),
  ('Training Update', 'Share your training progress', 'training', 'Grinding today! {workout_details} 💪', ARRAY['#TrainHard', '#NoOffSeason', '#ForSWAGsAthlete'], true),
  ('College Offer', 'Announce a scholarship offer', 'offer', 'Blessed to receive an offer from {school_name}! {details}', ARRAY['#Blessed', '#Recruited', '#ForSWAGsNation'], true),
  ('Commitment Announcement', 'Celebrate your commitment', 'commitment', 'COMMITTED! Excited to continue my academic and athletic career at {school_name}! {details}', ARRAY['#Committed', '#NextLevel', '#ForSWAGsAthlete'], true),
  ('Achievement Post', 'Share an accomplishment', 'achievement', 'Proud to announce {achievement}! {details}', ARRAY['#Achievement', '#HardWorkPaysOff', '#ForSWAGsNation'], true);