'use client';

import { useMemo, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { SynopticViewer } from './SynopticViewer';
import { NetworkFilterPanel } from './NetworkFilterPanel';
import { useLayout } from '../../hooks/use-layout';
import {
  applyNetworkFilters,
  createDefaultFilters,
  type NetworkFilters,
} from '../../shared/network-utils';

interface SiteLayoutTabProps {
  siteId: string;
  layouts: any[];
}

export function SiteLayoutTab({ siteId, layouts }: SiteLayoutTabProps) {
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(
    layouts && layouts.length > 0 ? layouts[0].id : null
  );
  const [filters, setFilters] = useState<NetworkFilters>(() => createDefaultFilters());

  if (!layouts || layouts.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center text-sm text-gray-600">
        No layouts have been created for this site yet.
      </div>
    );
  }

  const activeLayoutId = selectedLayoutId ?? layouts[0].id;

  const { data: layout, isLoading, error } = useLayout(activeLayoutId) as {
    data: any;
    isLoading: boolean;
    error: Error | null;
  };

  const nodes = layout?.nodes ?? [];
  const connections = layout?.connections ?? [];

  const { visibleNodeIds, visibleConnectionIds } = useMemo(
    () => applyNetworkFilters(nodes || [], connections || [], filters),
    [nodes, connections, filters]
  );

  const filteredNodes = useMemo(
    () => nodes.filter((n: any) => visibleNodeIds.has(n.id)),
    [nodes, visibleNodeIds]
  );

  const filteredConnections = useMemo(
    () => connections.filter((c: any) => visibleConnectionIds.has(c.id)),
    [connections, visibleConnectionIds]
  );

  const handleLayoutChange = (layoutId: string) => {
    setSelectedLayoutId(layoutId || null);
    setFilters(createDefaultFilters());
  };

  const handleFiltersReset = () => {
    setFilters(createDefaultFilters());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  if (error || !layout) {
    return (
      <div className="rounded-xl border-2 border-dashed border-red-200 bg-red-50 px-6 py-20 text-center">
        <p className="text-sm text-red-600">Failed to load layout data</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[720px] rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Top bar with layout selector */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span className="font-medium">Layout</span>
          <select
            value={activeLayoutId}
            onChange={(e) => handleLayoutChange(e.target.value)}
            className="ml-2 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {layouts.map((layout) => (
              <option key={layout.id} value={layout.id}>
                {layout.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter panel */}
      <NetworkFilterPanel
        filters={filters}
        onChange={setFilters}
        onReset={handleFiltersReset}
        nodes={nodes}
        connections={connections}
        siteId={siteId}
      />

      {/* Synoptic viewer canvas */}
      <div className="absolute inset-0 top-11">
        <ReactFlowProvider>
          <SynopticViewer
            nodes={filteredNodes}
            connections={filteredConnections}
            siteId={siteId}
            editable={false}
            showAnnotations={true}
            showLocationBadges={true}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
