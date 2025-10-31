/**
 * Feature Flag Wrapper for Unified Layout Editor
 * Routes to old or new implementation based on feature flags
 */

'use client';

import { FEATURE_FLAGS, logFeatureFlagUsage } from '@/lib/feature-flags';

// Old implementation
import { UnifiedLayoutEditor as UnifiedLayoutEditorOld } from './unified-layout-editor';

// New implementation
import { LayoutEditorContainer as UnifiedLayoutEditorNew } from './components/v2/LayoutEditorContainer';

interface UnifiedLayoutEditorWrapperProps {
  layout: any;
  organizationId: string;
  siteId?: string;
}

export function UnifiedLayoutEditorWrapper(props: UnifiedLayoutEditorWrapperProps) {
  const useNewVersion = FEATURE_FLAGS.USE_NEW_LAYOUT_EDITOR;

  // Log which version is being used
  if (typeof window !== 'undefined') {
    logFeatureFlagUsage('layout-editor', useNewVersion ? 'new' : 'old');
  }

  if (useNewVersion) {
    // New V2 implementation
    return (
      <UnifiedLayoutEditorNew
        layoutId={props.layout?.id}
        organizationId={props.organizationId}
        siteId={props.siteId}
      />
    );
  }

  // Old implementation (fallback)
  return <UnifiedLayoutEditorOld {...props} />;
}
