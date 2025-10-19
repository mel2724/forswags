-- Create chatbot configuration table
CREATE TABLE IF NOT EXISTS public.chatbot_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_name text NOT NULL DEFAULT 'Coach Ray',
  system_prompt text NOT NULL DEFAULT 'You are Coach Ray, an encouraging and supportive athletic coach. You help athletes, parents, and coaches with questions about recruiting, training, and development. Always be positive, motivating, and use sports metaphors. Call each person by a sports-related nickname like "Champ", "MVP", "All-Star", "Rookie", "Captain", etc.',
  personality_traits jsonb DEFAULT '{"encouraging": true, "knowledgeable": true, "friendly": true, "professional": true}'::jsonb,
  sports_nicknames text[] DEFAULT ARRAY['Champ', 'MVP', 'All-Star', 'Rookie', 'Captain', 'Ace', 'Winner', 'Pro', 'Superstar', 'Legend'],
  knowledge_base text DEFAULT 'ForSWAGs helps student athletes with recruiting, evaluations, college matching, and professional development through our comprehensive platform.',
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create chat conversations table
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  nickname text,
  started_at timestamp with time zone DEFAULT now(),
  last_message_at timestamp with time zone DEFAULT now()
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.chat_conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chatbot_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chatbot_config
CREATE POLICY "Anyone can view chatbot config"
  ON public.chatbot_config FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage chatbot config"
  ON public.chatbot_config FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for chat_conversations
CREATE POLICY "Users can view their own conversations"
  ON public.chat_conversations FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create conversations"
  ON public.chat_conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their conversations"
  ON public.chat_conversations FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all conversations"
  ON public.chat_conversations FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their conversations"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = chat_messages.conversation_id
        AND (user_id = auth.uid() OR user_id IS NULL)
    )
  );

CREATE POLICY "Users can create messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = chat_messages.conversation_id
        AND (user_id = auth.uid() OR user_id IS NULL)
    )
  );

CREATE POLICY "Admins can view all messages"
  ON public.chat_messages FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default chatbot configuration
INSERT INTO public.chatbot_config (coach_name, system_prompt, knowledge_base)
VALUES (
  'Coach Ray',
  'You are Coach Ray, an encouraging and supportive athletic coach at ForSWAGs. You help student athletes, parents, and coaches with questions about recruiting, training, and development. Always be positive, motivating, and use sports metaphors. Call each person by a sports-related nickname like "Champ", "MVP", "All-Star", "Rookie", "Captain", etc. Keep responses concise and actionable.',
  'ForSWAGs is a comprehensive platform for student athletes that provides: 
  - Professional athlete evaluations and coaching
  - College matching and recruiting guidance
  - Skills training through Playbook for Life courses
  - Media gallery and highlight management
  - Statistics tracking and analytics
  - Social media tools for athlete promotion
  - Parent verification and consent management for minors
  
  We offer Free, Pro Monthly, and Championship Yearly membership tiers with increasing features. Our mission is to help every student athlete reach their full potential and find the right college fit.'
)
ON CONFLICT DO NOTHING;