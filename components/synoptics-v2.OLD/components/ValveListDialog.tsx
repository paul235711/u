'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import type { GasType } from '@/components/synoptics/hierarchy/gas-indicators';

interface ValveListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  locationType: 'building' | 'floor' | 'zone';
  organizationId: string;
  siteId: string;
}

const GAS_COLORS: Record<GasType, string> = {
  oxygen: 'bg-red-500',
  medical_air: 'bg-yellow-500',
  nitrous_oxide: 'bg-blue-500',
  carbon_dioxide: 'bg-green-500',
  nitrogen: 'bg-gray-500',
  vacuum: 'bg-purple-500',
};

const GAS_LABELS: Record<GasType, string> = {
  oxygen: 'O₂',
  medical_air: 'Air',
  nitrous_oxide: 'N₂O',
  carbon_dioxide: 'CO₂',
  nitrogen: 'N₂',
  vacuum: 'Vac',
};

/**
 * Dialog to show all valves for a location
 */
export function ValveListDialog({ 
  open, 
  onOpenChange, 
  locationId,
  locationType,
  organizationId,
  siteId
}: ValveListDialogProps) {
  
  // Load valves for this location
  const { data: valves = [], isLoading } = useQuery({
    queryKey: ['valves-list', locationId, locationType],
    queryFn: async () => {
      const params = new URLSearchParams({
        organizationId,
        siteId,
      });
      
      const response = await fetch(`/api/synoptics/nodes?${params}`);
      if (!response.ok) return [];
      
      const nodes = await response.json();
      
      // Filter valves by location
      return nodes.filter((node: any) => {
        if (node.nodeType !== 'valve') return false;
        
        // Match exact location
        if (locationType === 'building') {
          return node.buildingId === locationId && !node.floorId && !node.zoneId;
        } else if (locationType === 'floor') {
          return node.floorId === locationId && !node.zoneId;
        } else if (locationType === 'zone') {
          return node.zoneId === locationId;
        }
        
        return false;
      });
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Isolation Valves ({valves.length})
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : valves.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-12">
            No valves found
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-4">
            {valves.map((valve: any) => (
              <div
                key={valve.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Placeholder for future photo */}
                <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Photo coming soon</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{valve.name || 'Unnamed Valve'}</h4>
                    {valve.gasType && (
                      <div
                        className={`inline-flex items-center justify-center rounded px-2 py-1 text-xs font-medium text-white ${
                          GAS_COLORS[valve.gasType as GasType] || 'bg-gray-500'
                        }`}
                      >
                        {GAS_LABELS[valve.gasType as GasType] || valve.gasType}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Type:</span>
                    <span>{valve.valveType || 'isolation'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">State:</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      valve.state === 'open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {valve.state || 'closed'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
