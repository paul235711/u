/**
 * Layout Editor Container - V2
 * Main orchestrator component that coordinates all sub-components
 * 
 * Improvements over old implementation:
 * - State managed by Zustand (no 21 useState calls!)
 * - Data fetched by React Query (automatic caching)
 * - Split into focused components (vs 914-line monolith)
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ReactFlowProvider } from '@xyflow/react';
import { useLayout } from '../hooks/use-layout';
import { useUIStore } from '../stores/ui-store';
import { LayoutEditorHeader } from './LayoutEditorHeader';
import { LayoutEditorCanvas } from './LayoutEditorCanvas';
import { LayoutEditorSidebar } from './LayoutEditorSidebar';
import { LayoutEditorDialogs } from './LayoutEditorDialogs';
import { Loader2 } from 'lucide-react';

interface LayoutEditorContainerProps {
  layoutId: string;
  organizationId: string;
  siteId?: string;
}

export function LayoutEditorContainer({
  layoutId,
  organizationId,
  siteId,
}: LayoutEditorContainerProps) {
  const router = useRouter();
  
  // Fetch layout data with React Query
  const { data: layout, isLoading, error } = useLayout(layoutId) as { 
    data: any; 
    isLoading: boolean; 
    error: Error | null 
  };
  
  // Reset UI state when component mounts
  const reset = useUIStore((state) => state.reset);
  useEffect(() => {
    return () => reset(); // Cleanup on unmount
  }, [reset]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading layout...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to load layout
          </h2>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // No layout data
  if (!layout) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">Layout not found</p>
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen">
        {/* Header with controls */}
        <LayoutEditorHeader layoutName={layout.name} />

        {/* Main canvas area */}
        <div className="flex-1 relative">
          <LayoutEditorCanvas
            layout={layout}
            layoutId={layoutId}
            organizationId={organizationId}
          />

          {/* Sidebar panels */}
          <LayoutEditorSidebar
            layout={layout}
            layoutId={layoutId}
            organizationId={organizationId}
            siteId={siteId}
          />
        </div>

        {/* Dialogs (QuickAdd, Delete Confirm, etc.) */}
        <LayoutEditorDialogs
          layout={layout}
          layoutId={layoutId}
          organizationId={organizationId}
        />
      </div>
    </ReactFlowProvider>
  );
}
