import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface AIUsageLog {
  function_name: string;
  model_used: string;
  user_id?: string;
  session_id?: string;
  request_type: string;
  tokens_estimated?: number;
  status: "success" | "rate_limit" | "error" | "insufficient_credits";
  error_message?: string;
  ip_address?: string;
}

export async function logAIUsage(
  supabaseClient: any,
  logData: AIUsageLog
): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from("ai_usage_logs")
      .insert({
        function_name: logData.function_name,
        model_used: logData.model_used,
        user_id: logData.user_id || null,
        session_id: logData.session_id || null,
        request_type: logData.request_type,
        tokens_estimated: logData.tokens_estimated || null,
        status: logData.status,
        error_message: logData.error_message || null,
        ip_address: logData.ip_address || null,
      });

    if (error) {
      console.error("[AI Usage Logging] Failed to log usage:", error);
    }
  } catch (err) {
    console.error("[AI Usage Logging] Exception while logging:", err);
  }
}
