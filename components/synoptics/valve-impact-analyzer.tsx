'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Building, Layers, Box, MapPin, Droplet, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ValveImpactAnalyzerProps {
  valve: any;
  nodes: any[];
  connections: any[];
  onClose: () => void;
  onHighlightNodes?: (nodeIds: string[]) => void;
}

interface ImpactAnalysis {
  affectedNodeIds: Set<string>;
  affectedNodes: any[];
  byBuilding: Map<string, any[]>;
  byFloor: Map<string, any[]>;
  byZone: Map<string, any[]>;
  unassigned: any[];
  totalAffected: number;
  criticalCount: number;
}

export function ValveImpactAnalyzer({
  valve,
  nodes,
  connections,
  onClose,
  onHighlightNodes,
}: ValveImpactAnalyzerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));

  // Perform impact analysis using graph traversal
  const impactAnalysis: ImpactAnalysis = useMemo(() => {
    // Build adjacency list for downstream traversal
    const adjacencyList = new Map<string, string[]>();
    connections.forEach((conn: any) => {
      if (!adjacencyList.has(conn.fromNodeId)) {
        adjacencyList.set(conn.fromNodeId, []);
      }
      adjacencyList.get(conn.fromNodeId)!.push(conn.toNodeId);
    });

    // Find all downstream nodes from this valve using BFS
    const affectedNodeIds = new Set<string>();
    const queue: string[] = [valve.id];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      
      if (visited.has(currentNodeId)) continue;
      visited.add(currentNodeId);
      
      // Don't include the valve itself in affected nodes
      if (currentNodeId !== valve.id) {
        affectedNodeIds.add(currentNodeId);
      }

      // Add downstream nodes
      const downstreamNodes = adjacencyList.get(currentNodeId) || [];
      downstreamNodes.forEach((nodeId) => {
        if (!visited.has(nodeId)) {
          queue.push(nodeId);
        }
      });
    }

    // Get full node data for affected nodes
    const affectedNodes = nodes.filter((node) => affectedNodeIds.has(node.id));

    // Group by location hierarchy
    const byBuilding = new Map<string, any[]>();
    const byFloor = new Map<string, any[]>();
    const byZone = new Map<string, any[]>();
    const unassigned: any[] = [];

    affectedNodes.forEach((node) => {
      if (!node.buildingId && !node.floorId && !node.zoneId) {
        unassigned.push(node);
      } else {
        if (node.buildingId) {
          if (!byBuilding.has(node.buildingId)) {
            byBuilding.set(node.buildingId, []);
          }
          byBuilding.get(node.buildingId)!.push(node);
        }
        if (node.floorId) {
          if (!byFloor.has(node.floorId)) {
            byFloor.set(node.floorId, []);
          }
          byFloor.get(node.floorId)!.push(node);
        }
        if (node.zoneId) {
          if (!byZone.has(node.zoneId)) {
            byZone.set(node.zoneId, []);
          }
          byZone.get(node.zoneId)!.push(node);
        }
      }
    });

    // Count critical nodes (other valves affected)
    const criticalCount = affectedNodes.filter((node) => node.nodeType === 'valve').length;

    return {
      affectedNodeIds,
      affectedNodes,
      byBuilding,
      byFloor,
      byZone,
      unassigned,
      totalAffected: affectedNodes.length,
      criticalCount,
    };
  }, [valve.id, nodes, connections]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const highlightAffectedNodes = () => {
    if (onHighlightNodes) {
      onHighlightNodes(Array.from(impactAnalysis.affectedNodeIds));
    }
  };

  const getSeverityColor = (count: number) => {
    if (count === 0) return 'text-green-600 bg-green-50 border-green-200';
    if (count < 5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (count < 10) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <Card className="absolute top-4 right-4 w-96 max-h-[calc(100vh-8rem)] shadow-lg z-20 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900">Valve Impact Analysis</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium">{valve.name}</span>
          <span className="mx-2">•</span>
          <span className="capitalize">{valve.gasType?.replace(/_/g, ' ')}</span>
        </div>
      </div>

      {/* Summary Section */}
      <div className="border-b border-gray-200">
        <button
          onClick={() => toggleSection('summary')}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <span className="font-semibold text-gray-900">Impact Summary</span>
          {expandedSections.has('summary') ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>
        {expandedSections.has('summary') && (
          <div className="px-4 pb-4 space-y-3">
            {/* Total Impact */}
            <div className={cn(
              "p-3 rounded-lg border-2",
              getSeverityColor(impactAnalysis.totalAffected)
            )}>
              <div className="text-2xl font-bold mb-1">
                {impactAnalysis.totalAffected}
              </div>
              <div className="text-sm font-medium">
                Downstream Elements Affected
              </div>
            </div>

            {/* Critical Elements */}
            {impactAnalysis.criticalCount > 0 && (
              <div className="p-3 rounded-lg bg-red-50 border-2 border-red-200">
                <div className="flex items-center gap-2 text-red-900">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-semibold">
                    {impactAnalysis.criticalCount} Critical Valve{impactAnalysis.criticalCount > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="text-xs text-red-700 mt-1">
                  Other valves will be affected
                </div>
              </div>
            )}

            {/* Highlight Button */}
            <Button
              onClick={highlightAffectedNodes}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Droplet className="mr-2 h-4 w-4" />
              Highlight Affected Network
            </Button>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* By Building */}
        {impactAnalysis.byBuilding.size > 0 && (
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection('buildings')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-gray-900">By Building</span>
                <Badge variant="secondary">{impactAnalysis.byBuilding.size}</Badge>
              </div>
              {expandedSections.has('buildings') ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {expandedSections.has('buildings') && (
              <div className="px-4 pb-4 space-y-2">
                {Array.from(impactAnalysis.byBuilding.entries()).map(([buildingId, buildingNodes]) => (
                  <div
                    key={buildingId}
                    className="p-2 rounded-md bg-blue-50 border border-blue-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-blue-900">
                        Building {buildingId.slice(0, 8)}...
                      </div>
                      <Badge variant="default" className="bg-blue-600">
                        {buildingNodes.length}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-blue-700">
                      {buildingNodes.map((n) => n.name).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* By Floor */}
        {impactAnalysis.byFloor.size > 0 && (
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection('floors')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-gray-900">By Floor</span>
                <Badge variant="secondary">{impactAnalysis.byFloor.size}</Badge>
              </div>
              {expandedSections.has('floors') ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {expandedSections.has('floors') && (
              <div className="px-4 pb-4 space-y-2">
                {Array.from(impactAnalysis.byFloor.entries()).map(([floorId, floorNodes]) => (
                  <div
                    key={floorId}
                    className="p-2 rounded-md bg-green-50 border border-green-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-green-900">
                        Floor {floorId.slice(0, 8)}...
                      </div>
                      <Badge variant="default" className="bg-green-600">
                        {floorNodes.length}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-green-700">
                      {floorNodes.map((n) => n.name).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* By Zone */}
        {impactAnalysis.byZone.size > 0 && (
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection('zones')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Box className="h-4 w-4 text-purple-600" />
                <span className="font-semibold text-gray-900">By Zone</span>
                <Badge variant="secondary">{impactAnalysis.byZone.size}</Badge>
              </div>
              {expandedSections.has('zones') ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {expandedSections.has('zones') && (
              <div className="px-4 pb-4 space-y-2">
                {Array.from(impactAnalysis.byZone.entries()).map(([zoneId, zoneNodes]) => (
                  <div
                    key={zoneId}
                    className="p-2 rounded-md bg-purple-50 border border-purple-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-purple-900">
                        Zone {zoneId.slice(0, 8)}...
                      </div>
                      <Badge variant="default" className="bg-purple-600">
                        {zoneNodes.length}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-purple-700">
                      {zoneNodes.map((n) => n.name).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Unassigned */}
        {impactAnalysis.unassigned.length > 0 && (
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection('unassigned')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-600" />
                <span className="font-semibold text-gray-900">Unassigned / External</span>
                <Badge variant="secondary">{impactAnalysis.unassigned.length}</Badge>
              </div>
              {expandedSections.has('unassigned') ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {expandedSections.has('unassigned') && (
              <div className="px-4 pb-4">
                <div className="p-2 rounded-md bg-gray-50 border border-gray-200">
                  <div className="text-xs text-gray-700">
                    {impactAnalysis.unassigned.map((n) => n.name).join(', ')}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Impact */}
        {impactAnalysis.totalAffected === 0 && (
          <div className="p-8 text-center">
            <div className="text-green-600 mb-2">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">No Downstream Impact</h4>
            <p className="text-sm text-gray-600">
              Closing this valve will not affect any other elements in the network.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
