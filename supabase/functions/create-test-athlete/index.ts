import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client
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

    const testEmail = 'tyler.brown@testmail.com';
    const testPassword = 'T0uchD0wn#Rul3z!';
    const parentEmail = 'parent.test@forswags.com';

    // Check if user already exists and delete it
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.email === testEmail);

    if (existingUser) {
      // Delete existing athlete and related records
      const { data: athleteData } = await supabaseAdmin
        .from('athletes')
        .select('id')
        .eq('user_id', existingUser.id)
        .single();

      if (athleteData) {
        // Delete related records first
        await supabaseAdmin
          .from('parent_verifications')
          .delete()
          .eq('athlete_id', athleteData.id);
      }

      // Delete auth user (cascades to profile and athlete)
      await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      console.log('Deleted existing test athlete account');
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Tyler Brown'
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    console.log('Created auth user:', authData.user.id);

    // The profile should be created automatically by trigger
    // Wait a moment for the trigger
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify profile exists
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile check error:', profileError);
      // Create profile manually if trigger failed
      await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: testEmail,
          full_name: 'Tyler Brown'
        });
    }

    // Assign athlete role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'athlete'
      });

    if (roleError && roleError.code !== '23505') { // Ignore duplicate key error
      console.error('Role assignment error:', roleError);
    }

    // Create athlete profile
    const { data: athleteData, error: athleteError } = await supabaseAdmin
      .from('athletes')
      .insert({
        user_id: authData.user.id,
        sport: 'Football',
        position: 'Quarterback',
        high_school: 'Central High School',
        graduation_year: 2028,
        date_of_birth: '2010-11-05',
        height_in: 70,
        weight_lb: 165,
        gpa: 3.5,
        jersey_number: '12',
        bio: 'Young quarterback with strong arm and leadership potential. Starting QB for freshman team. Working on decision-making and footwork.',
        visibility: 'private',
        public_profile_consent: false,
        is_parent_verified: false,
        parent_email: parentEmail
      })
      .select()
      .single();

    if (athleteError) throw athleteError;

    console.log('Created athlete profile:', athleteData.id);

    // Create parent verification request
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data: verificationData, error: verificationError } = await supabaseAdmin
      .from('parent_verifications')
      .insert({
        user_id: authData.user.id,
        athlete_id: athleteData.id,
        parent_email: parentEmail,
        verification_code: verificationCode,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })
      .select()
      .single();

    if (verificationError) {
      console.error('Verification creation error:', verificationError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test athlete created successfully',
        athlete: {
          email: testEmail,
          password: testPassword,
          name: 'Tyler Brown',
          userId: authData.user.id,
          athleteId: athleteData.id
        },
        parent: {
          email: parentEmail,
          verificationCode: verificationCode
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating test athlete:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
