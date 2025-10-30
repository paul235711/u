'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Filter, X, Eye, EyeOff, Search } from 'lucide-react';
import { GAS_TYPES } from './shared/gas-type-selector';

export interface NetworkFilters {
  searchQuery: string;
  selectedGasTypes: Set<string>;
  selectedNodeTypes: Set<'source' | 'valve' | 'fitting'>;
  showIsolated: boolean;
  highlightedNodes: Set<string>;
}

interface NetworkFilterPanelProps {
  filters: NetworkFilters;
  onChange: (filters: NetworkFilters) => void;
  onReset: () => void;
}

export function NetworkFilterPanel({ filters, onChange, onReset }: NetworkFilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleGasTypeToggle = (gasType: string) => {
    const newSet = new Set(filters.selectedGasTypes);
    if (newSet.has(gasType)) {
      newSet.delete(gasType);
    } else {
      newSet.add(gasType);
    }
    onChange({ ...filters, selectedGasTypes: newSet });
  };

  const handleNodeTypeToggle = (nodeType: 'source' | 'valve' | 'fitting') => {
    const newSet = new Set(filters.selectedNodeTypes);
    if (newSet.has(nodeType)) {
      newSet.delete(nodeType);
    } else {
      newSet.add(nodeType);
    }
    onChange({ ...filters, selectedNodeTypes: newSet });
  };

  const hasActiveFilters =
    filters.searchQuery ||
    filters.selectedGasTypes.size > 0 ||
    filters.selectedNodeTypes.size > 0 ||
    filters.showIsolated;

  return (
    <div className="absolute top-4 left-4 w-80 z-10">
      <Card className="bg-white/95 backdrop-blur-sm shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Filters & Highlights</h3>
              {hasActiveFilters && (
                <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
            >
              {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Filters Content */}
        {isExpanded && (
          <div className="p-4 space-y-4">
            {/* Search */}
            <div>
              <Label htmlFor="search" className="text-xs text-gray-700 mb-2 block">
                Search Elements
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by name..."
                  value={filters.searchQuery}
                  onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
                  className="pl-9 text-sm"
                />
              </div>
            </div>

            {/* Gas Types */}
            <div>
              <Label className="text-xs text-gray-700 mb-2 block">Filter by Gas Type</Label>
              <div className="space-y-1.5">
                {GAS_TYPES.map((gas) => (
                  <button
                    key={gas.value}
                    onClick={() => handleGasTypeToggle(gas.value)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-all ${
                      filters.selectedGasTypes.has(gas.value)
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-gray-50 border-2 border-transparent hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-1 ${gas.color} rounded`}></div>
                      <span className="font-medium text-gray-900">{gas.label}</span>
                    </div>
                    {filters.selectedGasTypes.has(gas.value) && (
                      <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Node Types */}
            <div>
              <Label className="text-xs text-gray-700 mb-2 block">Filter by Element Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['source', 'valve', 'fitting'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleNodeTypeToggle(type)}
                    className={`p-2 rounded-lg text-xs font-medium capitalize transition-all ${
                      filters.selectedNodeTypes.has(type)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type}s
                  </button>
                ))}
              </div>
            </div>

            {/* Special Filters */}
            <div>
              <Label className="text-xs text-gray-700 mb-2 block">Special Filters</Label>
              <button
                onClick={() => onChange({ ...filters, showIsolated: !filters.showIsolated })}
                className={`w-full p-2 rounded-lg text-xs font-medium text-left transition-all ${
                  filters.showIsolated
                    ? 'bg-orange-100 border-2 border-orange-500 text-orange-900'
                    : 'bg-gray-50 border-2 border-transparent hover:border-gray-300 text-gray-700'
                }`}
              >
                {filters.showIsolated ? '✓ ' : ''}Show Only Isolated Nodes
              </button>
            </div>

            {/* Actions */}
            {hasActiveFilters && (
              <div className="pt-3 border-t border-gray-200">
                <Button
                  onClick={onReset}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <X className="w-3 h-3 mr-2" />
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Compact View */}
        {!isExpanded && hasActiveFilters && (
          <div className="p-3 text-xs text-gray-600">
            <div className="flex flex-wrap gap-1">
              {filters.searchQuery && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Search: "{filters.searchQuery}"
                </span>
              )}
              {filters.selectedGasTypes.size > 0 && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  {filters.selectedGasTypes.size} gas type(s)
                </span>
              )}
              {filters.selectedNodeTypes.size > 0 && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                  {filters.selectedNodeTypes.size} node type(s)
                </span>
              )}
              {filters.showIsolated && (
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                  Isolated only
                </span>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export function createDefaultFilters(): NetworkFilters {
  return {
    searchQuery: '',
    selectedGasTypes: new Set(),
    selectedNodeTypes: new Set(),
    showIsolated: false,
    highlightedNodes: new Set(),
  };
}

/**
 * Apply filters to nodes
 */
export function applyFilters(
  nodes: any[],
  connections: any[],
  filters: NetworkFilters
): Set<string> {
  let filteredNodeIds = new Set(nodes.map((n) => n.id));

  // Apply search filter
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filteredNodeIds = new Set(
      nodes
        .filter(
          (node) =>
            node.name?.toLowerCase().includes(query) ||
            node.gasType?.toLowerCase().includes(query) ||
            node.nodeType?.toLowerCase().includes(query)
        )
        .map((n) => n.id)
    );
  }

  // Apply gas type filter
  if (filters.selectedGasTypes.size > 0) {
    filteredNodeIds = new Set(
      Array.from(filteredNodeIds).filter((id) => {
        const node = nodes.find((n) => n.id === id);
        return node && filters.selectedGasTypes.has(node.gasType);
      })
    );
  }

  // Apply node type filter
  if (filters.selectedNodeTypes.size > 0) {
    filteredNodeIds = new Set(
      Array.from(filteredNodeIds).filter((id) => {
        const node = nodes.find((n) => n.id === id);
        return node && filters.selectedNodeTypes.has(node.nodeType);
      })
    );
  }

  // Apply isolated filter
  if (filters.showIsolated) {
    const connectedNodeIds = new Set<string>();
    connections.forEach((conn: any) => {
      connectedNodeIds.add(conn.fromNodeId);
      connectedNodeIds.add(conn.toNodeId);
    });
    filteredNodeIds = new Set(
      Array.from(filteredNodeIds).filter((id) => !connectedNodeIds.has(id))
    );
  }

  return filteredNodeIds;
}
