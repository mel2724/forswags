-- Fix audit logging trigger to handle NULL user_id and scope to offer-documents only
CREATE OR REPLACE FUNCTION log_offer_document_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log operations on offer-documents bucket
  IF (TG_OP = 'DELETE' AND OLD.bucket_id != 'offer-documents') OR
     (TG_OP IN ('INSERT', 'UPDATE') AND NEW.bucket_id != 'offer-documents') THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Skip logging if no authenticated user (system operations)
  IF auth.uid() IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Log document operations to audit log
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, action, resource_type, metadata)
    VALUES (
      auth.uid(),
      'offer_document_delete',
      'storage_object',
      jsonb_build_object(
        'bucket', OLD.bucket_id,
        'name', OLD.name,
        'operation', 'DELETE'
      )
    );
    RETURN OLD;
  ELSE
    INSERT INTO audit_logs (user_id, action, resource_type, metadata)
    VALUES (
      auth.uid(),
      'offer_document_' || lower(TG_OP),
      'storage_object',
      jsonb_build_object(
        'bucket', NEW.bucket_id,
        'name', NEW.name,
        'operation', TG_OP
      )
    );
    RETURN NEW;
  END IF;
END;
$$;