import { useQuery, UseQueryOptions } from "@tanstack/react-query";

interface OptimizedQueryOptions<TData> extends Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'> {
  cacheTime?: number;
}

/**
 * Custom hook for optimized data fetching with enhanced caching
 * @param queryKey - Unique key for the query
 * @param queryFn - Function to fetch data
 * @param options - Additional options including custom cache time
 */
export function useOptimizedQuery<TData>(
  queryKey: Array<unknown>,
  queryFn: () => Promise<TData>,
  options?: OptimizedQueryOptions<TData>
) {
  const { cacheTime = 10 * 60 * 1000, ...restOptions } = options || {};

  return useQuery({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes default
    gcTime: cacheTime,
    refetchOnWindowFocus: false,
    retry: 1,
    ...restOptions,
  });
}

/**
 * Hook for frequently accessed static data with longer cache
 */
export function useStaticDataQuery<TData>(
  queryKey: Array<unknown>,
  queryFn: () => Promise<TData>,
  options?: OptimizedQueryOptions<TData>
) {
  return useOptimizedQuery(queryKey, queryFn, {
    ...options,
    staleTime: 30 * 60 * 1000, // 30 minutes for static data
    cacheTime: 60 * 60 * 1000, // 1 hour cache
  });
}

/**
 * Hook for real-time data that needs frequent updates
 */
export function useRealtimeQuery<TData>(
  queryKey: Array<unknown>,
  queryFn: () => Promise<TData>,
  options?: OptimizedQueryOptions<TData>
) {
  return useOptimizedQuery(queryKey, queryFn, {
    ...options,
    staleTime: 30 * 1000, // 30 seconds for real-time data
    cacheTime: 2 * 60 * 1000, // 2 minutes cache
    refetchOnWindowFocus: true,
  });
}
