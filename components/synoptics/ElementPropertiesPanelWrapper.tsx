/**
 * Feature Flag Wrapper for Element Properties Panel
 * Routes to old or new implementation based on feature flags
 */

'use client';

import { FEATURE_FLAGS, logFeatureFlagUsage } from '@/lib/feature-flags';

// Old implementation
import { ElementPropertiesPanel as ElementPropertiesPanelOld } from './element-properties-panel';

// New implementation
import { ElementPropertiesPanel as ElementPropertiesPanelNew } from '../synoptics-v2/components/ElementPropertiesPanel';

interface ElementPropertiesPanelWrapperProps {
  element: any;
  organizationId: string;
  layoutId?: string;
  onClose: () => void;
  onUpdate: (data: any) => void;
  onDelete: () => void;
}

export function ElementPropertiesPanelWrapper(props: ElementPropertiesPanelWrapperProps) {
  const useNewVersion = FEATURE_FLAGS.USE_NEW_PROPERTIES_PANEL;

  // Log which version is being used
  if (typeof window !== 'undefined') {
    logFeatureFlagUsage('properties-panel', useNewVersion ? 'new' : 'old');
  }

  if (useNewVersion) {
    // New V2 implementation
    // Note: New version handles updates internally, calls onUpdate callback with no args
    return (
      <ElementPropertiesPanelNew
        organizationId={props.organizationId}
        layoutId={props.layoutId}
        onUpdate={() => props.onUpdate?.({})}
        onDelete={props.onDelete}
      />
    );
  }

  // Old implementation (fallback)
  return <ElementPropertiesPanelOld {...props} />;
}
