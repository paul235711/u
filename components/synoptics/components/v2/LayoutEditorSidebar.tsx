/**
 * Layout Editor Sidebar - V2
 * Manages all side panels (Properties, Stats, Filters, Legend)
 */

'use client';

import { NetworkStatsPanel } from './NetworkStatsPanel';
import { NetworkFilterPanel, createDefaultFilters } from './NetworkFilterPanel';
import { useUIStore } from '../../stores/ui-store';
import { useState } from 'react';

interface LayoutEditorSidebarProps {
  layout: any;
  layoutId: string;
  organizationId: string;
  siteId?: string;
}

export function LayoutEditorSidebar({
  layout,
  layoutId,
  organizationId,
  siteId,
}: LayoutEditorSidebarProps) {
  const selectedElementId = useUIStore((state) => state.selectedElementId);
  const selectElement = useUIStore((state) => state.selectElement);
  const isLocked = useUIStore((state) => state.isLocked);
  
  const showStats = useUIStore((state) => state.panels.stats);
  const showFilters = useUIStore((state) => state.panels.filters);
  
  // Local state for filters (could be moved to Zustand if needed)
  const [filters, setFilters] = useState(createDefaultFilters());

  return (
    <>
      {/* Properties now handled by EquipmentBankEnhanced */}
      
      {/* Stats Panel */}
      {showStats && (
        <NetworkStatsPanel
          nodes={layout.nodes || []}
          connections={layout.connections || []}
          onIssueClick={(nodeIds) => {
            if (nodeIds.length > 0) {
              selectElement(nodeIds[0]);
            }
          }}
        />
      )}

      {/* Filters Panel */}
      {showFilters && (
        <NetworkFilterPanel
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(createDefaultFilters())}
          nodes={layout.nodes || []}
          connections={layout.connections || []}
          siteId={siteId}
        />
      )}

      {/* Legend is now in SynopticViewer */}
    </>
  );
}
