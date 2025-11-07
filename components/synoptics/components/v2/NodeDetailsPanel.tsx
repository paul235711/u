'use client';

import { X, MapPin, Building2, Layers, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MediaDisplay } from './MediaDisplay';
import { useQuery } from '@tanstack/react-query';

interface NodeDetailsPanelProps {
  node: any | null;
  siteId: string;
  onClose: () => void;
}

export function NodeDetailsPanel({ node, siteId, onClose }: NodeDetailsPanelProps) {
  // Fetch site hierarchy to get building/floor/zone names
  const { data: hierarchy } = useQuery({
    queryKey: ['site-hierarchy', siteId],
    queryFn: async () => {
      const res = await fetch(`/api/synoptics/sites/${siteId}/hierarchy`);
      if (!res.ok) throw new Error('Failed to fetch hierarchy');
      return res.json();
    },
    enabled: !!siteId,
  });

  // Extract location names from hierarchy
  const locationData = {
    building: undefined as string | undefined,
    floor: undefined as string | undefined,
    zone: undefined as string | undefined,
  };

  if (hierarchy?.buildings && node) {
    // Find building
    if (node.buildingId) {
      const building = hierarchy.buildings.find((b: any) => b.id === node.buildingId);
      if (building) {
        locationData.building = building.name;
        
        // Find floor
        if (node.floorId && building.floors) {
          const floor = building.floors.find((f: any) => f.id === node.floorId);
          if (floor) {
            locationData.floor = floor.name;
            
            // Find zone
            if (node.zoneId && floor.zones) {
              const zone = floor.zones.find((z: any) => z.id === node.zoneId);
              if (zone) {
                locationData.zone = zone.name;
              }
            }
          }
        }
      }
    }
  }

  if (!node) return null;

  const nodeTypeLabel = node.nodeType
    ? node.nodeType.charAt(0).toUpperCase() + node.nodeType.slice(1)
    : 'Equipment';

  return (
    <div className="w-80 h-full bg-white border-l border-gray-200 shadow-lg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Equipment Details</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Node Type Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {nodeTypeLabel}
            </Badge>
            {node.gasType && (
              <Badge variant="outline" className="text-sm capitalize">
                {node.gasType.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>

          {/* Name */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {node.name || node.label || `${nodeTypeLabel} ${node.id?.slice(0, 8) || 'N/A'}`}
            </h3>
            <p className="text-sm text-gray-500">ID: {node.id?.slice(0, 12) || 'N/A'}...</p>
          </div>

          {/* Media Display */}
          {node.elementId && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Media
              </h4>
              <MediaDisplay elementId={node.elementId} elementType={node.nodeType} />
            </div>
          )}

          {/* Location Information */}
          {(node.buildingId || node.floorId || node.zoneId) && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </h4>
              <div className="space-y-2">
                {node.buildingId && (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500">Building</div>
                      <div className="text-sm font-medium text-gray-900">
                        {locationData?.building || node.buildingId}
                      </div>
                    </div>
                  </div>
                )}
                
                {node.floorId && (
                  <div className="flex items-start gap-2">
                    <Layers className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500">Floor</div>
                      <div className="text-sm font-medium text-gray-900">
                        {locationData?.floor || node.floorId}
                      </div>
                    </div>
                  </div>
                )}
                
                {node.zoneId && (
                  <div className="flex items-start gap-2">
                    <Tag className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500">Zone</div>
                      <div className="text-sm font-medium text-gray-900">
                        {locationData?.zone || node.zoneId}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GPS Coordinates */}
          {(node.latitude || node.longitude) && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                GPS Coordinates
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                {node.latitude && (
                  <div>
                    <span className="font-medium">Lat:</span> {node.latitude}
                  </div>
                )}
                {node.longitude && (
                  <div>
                    <span className="font-medium">Lng:</span> {node.longitude}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Properties */}
          {node.nodeType === 'valve' && node.outletCount && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Outlet Count</h4>
              <div className="text-sm text-gray-600">{node.outletCount}</div>
            </div>
          )}

          {/* Technical Info */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Technical Info</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>
                <span className="font-medium">Position:</span> x: {node.position?.x?.toFixed(0) || node.position?.xPosition}, y: {node.position?.y?.toFixed(0) || node.position?.yPosition}
              </div>
              {node.createdAt && (
                <div>
                  <span className="font-medium">Created:</span> {new Date(node.createdAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
