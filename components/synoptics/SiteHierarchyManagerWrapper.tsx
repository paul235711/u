/**
 * Feature Flag Wrapper for Site Hierarchy Manager
 * Routes to old or new optimized implementation based on feature flags
 */

'use client';

import { FEATURE_FLAGS, logFeatureFlagUsage } from '@/lib/feature-flags';

// Old implementation
import { SiteHierarchyManagerV2 as SiteHierarchyManagerOld } from './site-hierarchy-manager-v2';

// New optimized implementation with React Query + Zustand
import { SiteHierarchyManagerOptimized } from '../synoptics-v2/components/SiteHierarchyManagerOptimized';

interface SiteHierarchyManagerWrapperProps {
  siteData: any;
  siteId: string;
  organizationId: string;
  layouts: any[];
}

export function SiteHierarchyManagerWrapper(props: SiteHierarchyManagerWrapperProps) {
  const useNewVersion = FEATURE_FLAGS.USE_NEW_HIERARCHY_MANAGER;

  // Log which version is being used
  if (typeof window !== 'undefined') {
    logFeatureFlagUsage('hierarchy-manager', useNewVersion ? 'new' : 'old');
  }

  // Use optimized version with React Query + Zustand
  if (useNewVersion) {
    return <SiteHierarchyManagerOptimized {...props} />;
  }

  // Old implementation (fallback)
  return <SiteHierarchyManagerOld {...props} />;
}
