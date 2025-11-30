import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify admin access
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { athleteIds, weekStartDate } = await req.json();

    if (!athleteIds || !Array.isArray(athleteIds) || athleteIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid athlete IDs' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const zip = new JSZip();
    const manifestData: any[] = [];

    // For each athlete, get their profile picture and info
    for (const athleteId of athleteIds) {
      // First get athlete info
      const { data: athlete, error: athleteError } = await supabaseClient
        .from('athletes')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url)
        `)
        .eq('id', athleteId)
        .single();

      if (athleteError || !athlete) {
        console.warn(`Athlete ${athleteId} not found:`, athleteError);
        continue;
      }

      // Then get their media - try profile picture first, then any media type
      const { data: mediaAssets, error: mediaError } = await supabaseClient
        .from('media_assets')
        .select('url, media_type, title')
        .eq('athlete_id', athleteId)
        .order('created_at', { ascending: false })
        .limit(1);

      let imageUrl: string | null = null;
      let mediaType: string = 'unknown';

      // Try media assets first
      if (!mediaError && mediaAssets && mediaAssets.length > 0) {
        imageUrl = mediaAssets[0].url;
        mediaType = mediaAssets[0].media_type || 'media';
      } 
      // Fall back to profile avatar_url
      else if (athlete.profiles?.avatar_url) {
        imageUrl = athlete.profiles.avatar_url;
        mediaType = 'avatar';
      }

      if (!imageUrl) {
        console.warn(`No media found for athlete ${athleteId}`);
        continue;
      }

      try {
        // Download the image
        const imageResponse = await fetch(imageUrl);
        
        if (!imageResponse.ok) {
          console.error(`Failed to download image for ${athlete.profiles.full_name}`);
          continue;
        }

        const imageBlob = await imageResponse.arrayBuffer();
        const extension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
        const sanitizedName = athlete.profiles.full_name.replace(/[^a-z0-9]/gi, '_');
        const filename = `${sanitizedName}.${extension}`;

        // Add image to ZIP
        zip.file(filename, imageBlob);

        // Add to manifest
        manifestData.push({
          athlete_id: athleteId,
          name: athlete.profiles.full_name,
          sport: athlete.sport,
          position: athlete.position,
          graduation_year: athlete.graduation_year,
          media_type: mediaType,
          filename: filename,
          original_url: imageUrl,
        });
      } catch (err) {
        console.error(`Error processing athlete ${athleteId}:`, err);
      }
    }

    // Check if we found any media
    if (manifestData.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No profile pictures found for the selected athletes. Please ensure athletes have profile pictures uploaded before creating a media pack.' 
        }), 
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Add manifest.json
    zip.file('manifest.json', JSON.stringify(manifestData, null, 2));

    // Generate README
    const readme = `Athlete Media Pack
Generated: ${new Date().toISOString()}
${weekStartDate ? `Week Starting: ${weekStartDate}` : ''}

This package contains profile pictures for ${manifestData.length} athletes.
See manifest.json for detailed information about each athlete and their files.

ForSWAGs - Athlete Management System`;

    zip.file('README.txt', readme);

    // Generate the ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    const filename = weekStartDate 
      ? `athlete_media_pack_week_${weekStartDate.replace(/\//g, '-')}.zip`
      : `athlete_media_pack_${new Date().toISOString().split('T')[0]}.zip`;

    return new Response(zipBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error: any) {
    console.error('Error creating media pack:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});