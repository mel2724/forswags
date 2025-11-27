/**
 * Storage Cleanup Service
 * Handles QuotaExceededError by clearing old localStorage/sessionStorage data
 */

const CLEANUP_INTERVAL = 1000 * 60 * 60; // 1 hour
const LAST_CLEANUP_KEY = 'last_storage_cleanup';
const SUPABASE_SESSION_PREFIX = 'sb-fejnevxardxejdvjbipc-auth-token';

/**
 * Clears localStorage except for critical data
 */
export const cleanupLocalStorage = () => {
  try {
    const keysToKeep = [LAST_CLEANUP_KEY, SUPABASE_SESSION_PREFIX];
    const allKeys = Object.keys(localStorage);
    let removedCount = 0;

    allKeys.forEach(key => {
      if (!keysToKeep.some(keepKey => key.includes(keepKey))) {
        localStorage.removeItem(key);
        removedCount++;
      }
    });

    localStorage.setItem(LAST_CLEANUP_KEY, Date.now().toString());
    console.log(`LocalStorage cleanup: removed ${removedCount} items`);
    return { success: true, removedCount };
  } catch (error) {
    console.error('LocalStorage cleanup failed:', error);
    return { success: false, error };
  }
};

/**
 * Emergency cleanup when QuotaExceededError occurs
 * Clears everything except Supabase auth session
 */
export const emergencyStorageCleanup = () => {
  try {
    // Save Supabase session
    const sessionKeys = Object.keys(sessionStorage).filter(key => 
      key.startsWith(SUPABASE_SESSION_PREFIX)
    );
    const savedSessions: Record<string, string> = {};
    sessionKeys.forEach(key => {
      const value = sessionStorage.getItem(key);
      if (value) savedSessions[key] = value;
    });

    // Clear everything
    localStorage.clear();
    sessionStorage.clear();

    // Restore Supabase session
    Object.entries(savedSessions).forEach(([key, value]) => {
      sessionStorage.setItem(key, value);
    });

    localStorage.setItem(LAST_CLEANUP_KEY, Date.now().toString());
    console.log('Emergency storage cleanup completed');
    return { success: true };
  } catch (error) {
    console.error('Emergency cleanup failed:', error);
    return { success: false, error };
  }
};

/**
 * Checks if cleanup is needed based on last cleanup time
 */
const shouldRunCleanup = (): boolean => {
  try {
    const lastCleanup = localStorage.getItem(LAST_CLEANUP_KEY);
    if (!lastCleanup) return true;

    const timeSinceCleanup = Date.now() - parseInt(lastCleanup, 10);
    return timeSinceCleanup >= CLEANUP_INTERVAL;
  } catch {
    return true; // Run cleanup if we can't check
  }
};

/**
 * Initializes the background cleanup service
 */
export const initLocalStorageCleanup = () => {
  // Run cleanup immediately if needed
  if (shouldRunCleanup()) {
    cleanupLocalStorage();
  }

  // Set up periodic cleanup
  const intervalId = setInterval(() => {
    if (shouldRunCleanup()) {
      cleanupLocalStorage();
    }
  }, CLEANUP_INTERVAL);

  // Return cleanup function to stop the interval if needed
  return () => clearInterval(intervalId);
};

/**
 * Gets localStorage usage info
 */
export const getLocalStorageInfo = () => {
  try {
    let totalSize = 0;
    const items: Array<{ key: string; size: number }> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        const size = new Blob([value]).size;
        totalSize += size;
        items.push({ key, size });
      }
    }

    return {
      totalSize,
      itemCount: localStorage.length,
      items: items.sort((a, b) => b.size - a.size),
      formattedSize: formatBytes(totalSize)
    };
  } catch (error) {
    console.error('Failed to get localStorage info:', error);
    return null;
  }
};

/**
 * Helper to format bytes to human readable format
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
