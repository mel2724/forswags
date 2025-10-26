import { supabase } from "@/integrations/supabase/client";

/**
 * Optimized query helpers for complex database operations
 */

// Cache for frequently accessed lookup data
const lookupCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached data or fetch from database
 */
function getCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = lookupCache.get(key);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return Promise.resolve(cached.data);
  }

  return fetcher().then(data => {
    lookupCache.set(key, { data, timestamp: now });
    return data;
  });
}

/**
 * Optimized athlete profile query with selected fields only
 */
export async function getAthleteProfile(athleteId: string) {
  return getCached(`athlete:${athleteId}`, async () => {
    const { data, error } = await supabase
      .from("athletes")
      .select(`
        id,
        user_id,
        sport,
        position,
        graduation_year,
        height_in,
        weight_lb,
        gpa,
        high_school,
        bio,
        profile_photo_url,
        highlights_url,
        key_stats
      `)
      .eq("id", athleteId)
      .single();

    if (error) throw error;
    return data;
  });
}

/**
 * Optimized media assets query with pagination
 */
export async function getMediaAssets(
  athleteId: string,
  limit: number = 20,
  offset: number = 0
) {
  const { data, error, count } = await supabase
    .from("media_assets")
    .select("id, title, description, url, media_type, created_at", { count: "exact" })
    .eq("athlete_id", athleteId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data, count };
}

/**
 * Optimized evaluations query with joins
 */
export async function getAthleteEvaluations(athleteId: string) {
  const { data, error } = await supabase
    .from("evaluations")
    .select(`
      id,
      status,
      rating,
      completed_at,
      purchased_at,
      coach_id,
      coach_profiles!inner(full_name, avatar_url)
    `)
    .eq("athlete_id", athleteId)
    .order("purchased_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return data;
}

/**
 * Optimized Prime Dime matches query
 */
export async function getCollegeMatches(athleteId: string) {
  const { data, error } = await supabase
    .from("college_matches")
    .select(`
      id,
      match_score,
      academic_fit,
      athletic_fit,
      financial_fit,
      is_saved,
      school_id,
      schools!inner(name, city, state, division, logo_url)
    `)
    .eq("athlete_id", athleteId)
    .order("match_score", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data;
}

/**
 * Batch fetch multiple athletes efficiently
 */
export async function batchGetAthletes(athleteIds: string[]) {
  if (athleteIds.length === 0) return [];

  const { data, error } = await supabase
    .from("athletes")
    .select(`
      id,
      sport,
      position,
      graduation_year,
      high_school,
      profile_photo_url,
      profiles!inner(full_name)
    `)
    .in("id", athleteIds);

  if (error) throw error;
  return data;
}

/**
 * Clear cache for specific key or all cache
 */
export function clearQueryCache(key?: string) {
  if (key) {
    lookupCache.delete(key);
  } else {
    lookupCache.clear();
  }
}

/**
 * Prefetch common data to warm up cache
 */
export async function prefetchCommonData(userId: string) {
  try {
    // Prefetch user's athlete profile
    const { data: athlete } = await supabase
      .from("athletes")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (athlete?.id) {
      // Warm up caches in parallel
      await Promise.all([
        getAthleteProfile(athlete.id),
        getMediaAssets(athlete.id, 5, 0),
      ]);
    }
  } catch (error) {
    console.error("Error prefetching data:", error);
  }
}
