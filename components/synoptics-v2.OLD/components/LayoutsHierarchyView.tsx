/**
 * Layouts Hierarchy View - Maps layouts to site hierarchy
 * Shows layouts organized by Site > Building > Floor > Zone
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Layers, ChevronDown, ChevronRight, Building2, 
  MapPin, Plus, Edit, Trash2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface LayoutsHierarchyViewProps {
  siteData: any;
  siteId: string;
  layouts: any[];
}

export function LayoutsHierarchyView({ siteData, siteId, layouts }: LayoutsHierarchyViewProps) {
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set());

  // Group layouts by hierarchy level (Site or Floor only)
  const siteLayouts = layouts.filter(l => !l.floorId);
  
  const getLayoutsForFloor = (floorId: string) => 
    layouts.filter(l => l.floorId === floorId);

  const toggleBuilding = (id: string) => {
    const newSet = new Set(expandedBuildings);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedBuildings(newSet);
  };

  const toggleFloor = (id: string) => {
    const newSet = new Set(expandedFloors);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedFloors(newSet);
  };

  return (
    <div className="space-y-6">
      {/* Site Level Layouts */}
      <div className="border rounded-lg p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Layers className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{siteData.name}</h3>
              <p className="text-sm text-gray-500">Site-level layouts</p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link href={`/synoptics/sites/${siteId}/layouts/new`}>
              <Plus className="h-4 w-4 mr-2" />
              Add Layout
            </Link>
          </Button>
        </div>
        
        {siteLayouts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {siteLayouts.map(layout => (
              <LayoutCard key={layout.id} layout={layout} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No site-level layouts yet
          </div>
        )}
      </div>

      {/* Floors Hierarchy (grouped by Building) */}
      {siteData.buildings?.map((building: any) => {
        const isExpanded = expandedBuildings.has(building.id);
        const hasFloorLayouts = building.floors?.some((floor: any) => 
          getLayoutsForFloor(floor.id).length > 0
        );
        
        if (!hasFloorLayouts) return null;
        
        return (
          <Collapsible
            key={building.id}
            open={isExpanded}
            onOpenChange={() => toggleBuilding(building.id)}
          >
            <div className="border rounded-lg bg-white">
              <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                  <Building2 className="h-5 w-5 text-purple-600" />
                  <div className="text-left">
                    <h4 className="font-semibold">{building.name}</h4>
                    <p className="text-sm text-gray-500">
                      {building.floors?.length || 0} floor{building.floors?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">
                  {building.floors?.length || 0} floor{building.floors?.length !== 1 ? 's' : ''}
                </Badge>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="p-4 pt-0 space-y-3">
                  {/* Floors with layouts */}
                  {building.floors?.map((floor: any) => {
                    const floorLayouts = getLayoutsForFloor(floor.id);
                    
                    if (floorLayouts.length === 0) return null;
                    
                    return (
                      <div key={floor.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-3">
                          <Layers className="h-5 w-5 text-green-600" />
                          <span className="font-semibold">{floor.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {floorLayouts.length} layout{floorLayouts.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {floorLayouts.map((layout: any) => (
                            <LayoutCard key={layout.id} layout={layout} compact />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}

function LayoutCard({ layout, compact = false }: { layout: any; compact?: boolean }) {
  return (
    <Link
      href={`/synoptics/layouts/${layout.id}`}
      className="block group"
    >
      <div className={`border rounded-lg p-3 hover:shadow-md hover:border-blue-300 transition-all bg-white ${
        compact ? 'hover:bg-blue-50' : ''
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Layers className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <span className="font-medium text-sm group-hover:text-blue-600 truncate">
              {layout.name}
            </span>
          </div>
          <Badge variant="outline" className="text-xs capitalize flex-shrink-0 ml-2">
            {layout.layoutType}
          </Badge>
        </div>
      </div>
    </Link>
  );
}
