/**
 * LocalStorage Cleanup Service
 * Automatically cleans up old localStorage data to prevent quota issues
 */

const CLEANUP_INTERVAL = 1000 * 60 * 60; // 1 hour
const LAST_CLEANUP_KEY = 'last_localStorage_cleanup';
const SUPABASE_AUTH_KEY_PATTERN = 'sb-fejnevxardxejdvjbipc-auth-token';

/**
 * Clears localStorage except for critical auth tokens
 */
export const cleanupLocalStorage = () => {
  try {
    const keysToKeep = [SUPABASE_AUTH_KEY_PATTERN, LAST_CLEANUP_KEY];
    const allKeys = Object.keys(localStorage);
    let removedCount = 0;

    allKeys.forEach(key => {
      // Keep Supabase auth tokens and cleanup timestamp
      if (!keysToKeep.some(keepKey => key.includes(keepKey))) {
        localStorage.removeItem(key);
        removedCount++;
      }
    });

    // Update last cleanup timestamp
    localStorage.setItem(LAST_CLEANUP_KEY, Date.now().toString());
    
    console.log(`LocalStorage cleanup completed: removed ${removedCount} items`);
    return { success: true, removedCount };
  } catch (error) {
    console.error('LocalStorage cleanup failed:', error);
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
