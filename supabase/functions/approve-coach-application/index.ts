import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify admin role
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      throw new Error('Unauthorized: Admin access required');
    }

    const { applicationId, adminNotes } = await req.json();

    if (!applicationId) {
      throw new Error('Application ID is required');
    }

    // Get application details
    const { data: application, error: appError } = await supabaseAdmin
      .from('coach_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      throw new Error('Application not found');
    }

    if (application.status === 'approved') {
      throw new Error('Application already approved');
    }

    // Create auth user with temporary password
    const tempPassword = crypto.randomUUID();
    const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: application.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: application.full_name,
      },
    });

    if (createUserError) {
      throw new Error(`Failed to create auth user: ${createUserError.message}`);
    }

    const newUserId = authData.user.id;

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUserId,
        email: application.email,
        full_name: application.full_name,
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Continue even if profile exists
    }

    // Assign coach role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUserId,
        role: 'coach',
      });

    if (roleError) {
      throw new Error(`Failed to assign coach role: ${roleError.message}`);
    }

    // Create coach profile
    const { error: coachProfileError } = await supabaseAdmin
      .from('coach_profiles')
      .insert({
        user_id: newUserId,
        full_name: application.full_name,
        specializations: application.specializations || [],
        certifications: application.certifications,
        experience_years: application.experience_years,
        twitter_handle: application.twitter_handle,
        instagram_handle: application.instagram_handle,
        facebook_handle: application.facebook_handle,
        tiktok_handle: application.tiktok_handle,
      });

    if (coachProfileError) {
      throw new Error(`Failed to create coach profile: ${coachProfileError.message}`);
    }

    // Update application status
    const { error: updateError } = await supabaseAdmin
      .from('coach_applications')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes,
      })
      .eq('id', applicationId);

    if (updateError) {
      throw new Error(`Failed to update application: ${updateError.message}`);
    }

    // Send password reset email so coach can set their password
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: application.email,
    });

    if (resetError) {
      console.error('Failed to send password reset email:', resetError);
      // Don't fail the whole operation if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId: newUserId,
        message: 'Coach account created successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error approving coach application:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
