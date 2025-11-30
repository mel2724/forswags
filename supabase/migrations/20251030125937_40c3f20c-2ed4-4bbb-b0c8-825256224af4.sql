-- Create AI usage tracking table
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  model_used TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  request_type TEXT NOT NULL, -- 'chat', 'analysis', 'generation', etc.
  tokens_estimated INTEGER,
  status TEXT NOT NULL, -- 'success', 'rate_limit', 'error', 'insufficient_credits'
  error_message TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_ai_usage_logs_created_at ON public.ai_usage_logs(created_at DESC);
CREATE INDEX idx_ai_usage_logs_function ON public.ai_usage_logs(function_name);
CREATE INDEX idx_ai_usage_logs_status ON public.ai_usage_logs(status);
CREATE INDEX idx_ai_usage_logs_user_id ON public.ai_usage_logs(user_id);

-- Enable RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view all AI usage logs" ON public.ai_usage_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Users can view their own logs
CREATE POLICY "Users can view their own AI usage logs" ON public.ai_usage_logs
FOR SELECT USING (auth.uid() = user_id);

-- System can insert logs (via service role)
CREATE POLICY "Service role can insert AI usage logs" ON public.ai_usage_logs
FOR INSERT WITH CHECK (true);

-- Create AI usage alerts table
CREATE TABLE IF NOT EXISTS public.ai_usage_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL, -- 'daily_threshold', 'weekly_threshold', 'rate_limit_spike', 'error_spike'
  threshold_value INTEGER NOT NULL,
  current_value INTEGER NOT NULL,
  alert_message TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.ai_usage_alerts ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage alerts
CREATE POLICY "Admins can view all AI usage alerts" ON public.ai_usage_alerts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update AI usage alerts" ON public.ai_usage_alerts
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create function to get daily usage stats
CREATE OR REPLACE FUNCTION public.get_daily_ai_usage()
RETURNS TABLE (
  date DATE,
  total_requests BIGINT,
  successful_requests BIGINT,
  failed_requests BIGINT,
  rate_limited_requests BIGINT,
  unique_users BIGINT,
  estimated_tokens BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE status = 'success') as successful_requests,
    COUNT(*) FILTER (WHERE status = 'error') as failed_requests,
    COUNT(*) FILTER (WHERE status = 'rate_limit') as rate_limited_requests,
    COUNT(DISTINCT user_id) as unique_users,
    COALESCE(SUM(tokens_estimated), 0) as estimated_tokens
  FROM public.ai_usage_logs
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
END;
$$;

-- Create function to check thresholds and create alerts
CREATE OR REPLACE FUNCTION public.check_ai_usage_thresholds()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_daily_requests INTEGER;
  v_hourly_rate_limits INTEGER;
  v_hourly_errors INTEGER;
BEGIN
  -- Check daily request threshold (e.g., 1000 requests per day)
  SELECT COUNT(*) INTO v_daily_requests
  FROM public.ai_usage_logs
  WHERE created_at >= CURRENT_DATE;

  IF v_daily_requests > 1000 THEN
    INSERT INTO public.ai_usage_alerts (alert_type, threshold_value, current_value, alert_message)
    VALUES (
      'daily_threshold',
      1000,
      v_daily_requests,
      'Daily AI request threshold exceeded: ' || v_daily_requests || ' requests today (threshold: 1000)'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Check for rate limit spike (more than 10 in last hour)
  SELECT COUNT(*) INTO v_hourly_rate_limits
  FROM public.ai_usage_logs
  WHERE created_at >= NOW() - INTERVAL '1 hour'
    AND status = 'rate_limit';

  IF v_hourly_rate_limits > 10 THEN
    INSERT INTO public.ai_usage_alerts (alert_type, threshold_value, current_value, alert_message)
    VALUES (
      'rate_limit_spike',
      10,
      v_hourly_rate_limits,
      'Rate limit spike detected: ' || v_hourly_rate_limits || ' rate limits in the last hour'
    );
  END IF;

  -- Check for error spike (more than 20 in last hour)
  SELECT COUNT(*) INTO v_hourly_errors
  FROM public.ai_usage_logs
  WHERE created_at >= NOW() - INTERVAL '1 hour'
    AND status = 'error';

  IF v_hourly_errors > 20 THEN
    INSERT INTO public.ai_usage_alerts (alert_type, threshold_value, current_value, alert_message)
    VALUES (
      'error_spike',
      20,
      v_hourly_errors,
      'Error spike detected: ' || v_hourly_errors || ' errors in the last hour'
    );
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_daily_ai_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_ai_usage_thresholds() TO service_role;