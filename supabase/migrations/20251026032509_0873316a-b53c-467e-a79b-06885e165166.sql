-- Add authorization checks and security logging to archive functions

-- Update archive_user_data to include authorization and logging
CREATE OR REPLACE FUNCTION public.archive_user_data(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_membership_id uuid;
  v_archived_data jsonb;
BEGIN
  -- Authorization check: Only allow user themselves or admins
  IF NOT (auth.uid() = p_user_id OR has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Unauthorized: Cannot archive data for another user';
  END IF;
  
  -- Log security event
  PERFORM log_security_event(
    'user_data_archived',
    'high',
    'User data archived due to subscription cancellation or manual request',
    jsonb_build_object(
      'target_user_id', p_user_id,
      'initiated_by', auth.uid()
    )
  );
  
  -- Get current membership
  SELECT id INTO v_membership_id
  FROM memberships
  WHERE user_id = p_user_id
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_membership_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Mark all user's media as archived (triggers archive_media_file)
  UPDATE media_assets
  SET is_archived = true, archived_at = now()
  WHERE user_id = p_user_id AND is_archived = false;
  
  -- Archive college matches, analytics data, etc.
  v_archived_data := jsonb_build_object(
    'archived_at', now(),
    'restore_until', now() + interval '6 months',
    'college_matches', (
      SELECT jsonb_agg(row_to_json(cm))
      FROM college_matches cm
      JOIN athletes a ON a.id = cm.athlete_id
      WHERE a.user_id = p_user_id
    ),
    'profile_views', (
      SELECT jsonb_agg(row_to_json(pv))
      FROM profile_views pv
      JOIN athletes a ON a.id = pv.athlete_id
      WHERE a.user_id = p_user_id
    ),
    'media_count', (
      SELECT COUNT(*)
      FROM archived_media
      WHERE user_id = p_user_id
    )
  );
  
  -- Update membership with archived data
  UPDATE memberships
  SET 
    archived_data = v_archived_data,
    downgraded_at = now()
  WHERE id = v_membership_id;
END;
$$;

-- Update archive_alumni_account to include authorization and logging
CREATE OR REPLACE FUNCTION public.archive_alumni_account(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_media_count integer;
  v_alumni_id uuid;
BEGIN
  -- Authorization check: Only allow user themselves or admins
  IF NOT (auth.uid() = p_user_id OR has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Unauthorized: Cannot archive alumni account for another user';
  END IF;
  
  -- Log security event
  PERFORM log_security_event(
    'alumni_account_archived',
    'high',
    'Alumni account archived',
    jsonb_build_object(
      'target_user_id', p_user_id,
      'initiated_by', auth.uid()
    )
  );
  
  -- Get alumni profile
  SELECT id INTO v_alumni_id
  FROM alumni
  WHERE user_id = p_user_id;
  
  IF v_alumni_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Alumni profile not found');
  END IF;
  
  -- Archive all user data
  PERFORM archive_user_data(p_user_id);
  
  -- Count archived media
  SELECT COUNT(*) INTO v_media_count
  FROM archived_media
  WHERE user_id = p_user_id;
  
  -- Mark alumni as inactive but keep data
  UPDATE alumni
  SET 
    available_for_calls = false,
    willing_to_mentor = false,
    bio = COALESCE(bio, '') || ' [ACCOUNT ARCHIVED]'
  WHERE id = v_alumni_id;
  
  v_result := jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'alumni_id', v_alumni_id,
    'archived_media_count', v_media_count,
    'archived_at', now()
  );
  
  RETURN v_result;
END;
$$;