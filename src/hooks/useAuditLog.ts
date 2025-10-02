import { supabase } from "@/integrations/supabase/client";

interface AuditLogParams {
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

export function useAuditLog() {
  const logAction = async ({
    action,
    resourceType,
    resourceId,
    metadata = {},
  }: AuditLogParams) => {
    try {
      const { error } = await supabase.rpc('log_audit_event', {
        p_action: action,
        p_resource_type: resourceType,
        p_resource_id: resourceId || null,
        p_metadata: metadata,
      });

      if (error) {
        console.error("Failed to log audit event:", error);
      }
    } catch (error) {
      console.error("Error logging audit event:", error);
    }
  };

  return { logAction };
}
