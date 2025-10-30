/**
 * Feature flag system for gradual rollout
 * Allows running old and new code side-by-side
 */

export const FEATURE_FLAGS = {
  // Synoptics V2 Architecture - Core Components (Fully Migrated)
  USE_NEW_PROPERTIES_PANEL: process.env.NEXT_PUBLIC_USE_NEW_PROPERTIES_PANEL === 'true',
  USE_NEW_LAYOUT_EDITOR: process.env.NEXT_PUBLIC_USE_NEW_LAYOUT_EDITOR === 'true',
  
  // Synoptics V2 Architecture - Optional Components (Infrastructure Ready)
  USE_NEW_HIERARCHY_MANAGER: process.env.NEXT_PUBLIC_USE_NEW_HIERARCHY_MANAGER === 'true',
  USE_NEW_IMPORT_DIALOG: process.env.NEXT_PUBLIC_USE_NEW_IMPORT_DIALOG === 'true',
  USE_NEW_LOCATION_FILTER: process.env.NEXT_PUBLIC_USE_NEW_LOCATION_FILTER === 'true',
  
  // Percentage-based rollout (0-100)
  NEW_ARCHITECTURE_ROLLOUT: parseInt(process.env.NEXT_PUBLIC_NEW_ARCH_ROLLOUT || '0', 10),
} as const;

/**
 * Check if user should get new feature based on percentage rollout
 * Uses consistent hashing based on user ID to ensure same user gets same experience
 */
export function shouldUseNewFeature(featureName: string, userId?: string): boolean {
  // If explicit flag is set, use it
  if (featureName === 'properties-panel' && FEATURE_FLAGS.USE_NEW_PROPERTIES_PANEL) {
    return true;
  }
  
  // Otherwise, use percentage-based rollout
  const rolloutPercentage = FEATURE_FLAGS.NEW_ARCHITECTURE_ROLLOUT;
  
  if (rolloutPercentage === 0) return false;
  if (rolloutPercentage >= 100) return true;
  
  // Consistent hashing based on userId
  if (userId) {
    const hash = simpleHash(userId);
    return (hash % 100) < rolloutPercentage;
  }
  
  // Fallback to random (for non-authenticated users)
  return Math.random() * 100 < rolloutPercentage;
}

/**
 * Simple hash function for consistent user bucketing
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Log feature flag usage for analytics
 */
export function logFeatureFlagUsage(featureName: string, version: 'old' | 'new') {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Feature Flag] ${featureName}: ${version}`);
  }
  
  // In production, send to analytics
  // Example: analytics.track('feature_flag_used', { feature: featureName, version });
}
