'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, Layers, Box, Search, Loader2, ChevronDown, ChevronRight, Package, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EquipmentNode {
  id: string;
  name: string;
  nodeType: 'source' | 'valve' | 'fitting';
  gasType: string;
  buildingId: string | null;
  floorId: string | null;
  zoneId: string | null;
  elementId: string;
  valveType?: string;
  fittingType?: string;
}

interface Building {
  id: string;
  name: string;
  floors: Floor[];
}

interface Floor {
  id: string;
  floorNumber: number;
  name: string | null;
  buildingId: string;
  zones: Zone[];
}

interface Zone {
  id: string;
  name: string;
  floorId: string;
}

interface EquipmentImportDialogProps {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  siteId: string;
  layoutId: string;
  onImport: (nodeIds: string[]) => Promise<void>;
}

export function EquipmentImportDialog({
  open,
  onClose,
  organizationId,
  siteId,
  layoutId,
  onImport,
}: EquipmentImportDialogProps) {
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [allEquipment, setAllEquipment] = useState<EquipmentNode[]>([]);
  const [existingNodeIds, setExistingNodeIds] = useState<Set<string>>(new Set());
  
  // Selection state
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set());

  // Load data
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, organizationId, siteId, layoutId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch site hierarchy
      const siteResponse = await fetch(`/api/synoptics/sites/${siteId}/hierarchy`);
      if (!siteResponse.ok) throw new Error('Failed to load site hierarchy');
      const siteData = await siteResponse.json();
      
      // Fetch equipment nodes filtered by site (server-side filtering for efficiency)
      const equipmentResponse = await fetch(
        `/api/synoptics/nodes?organizationId=${organizationId}&siteId=${siteId}`
      );
      if (!equipmentResponse.ok) throw new Error('Failed to load equipment');
      const equipmentData = await equipmentResponse.json();
      
      // Fetch existing nodes in this layout
      const layoutResponse = await fetch(`/api/synoptics/layouts/${layoutId}/nodes`);
      if (!layoutResponse.ok) throw new Error('Failed to load layout nodes');
      const layoutNodes = await layoutResponse.json();
      
      setBuildings(siteData.buildings || []);
      setAllEquipment(equipmentData);
      setExistingNodeIds(new Set(layoutNodes.map((n: any) => n.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Filter available equipment (not already in layout)
  const availableEquipment = useMemo(() => {
    return allEquipment.filter(node => !existingNodeIds.has(node.id));
  }, [allEquipment, existingNodeIds]);

  // Group equipment by location
  const equipmentByLocation = useMemo(() => {
    const grouped = new Map<string, EquipmentNode[]>();
    
    availableEquipment.forEach(node => {
      const key = node.zoneId || node.floorId || node.buildingId || 'unassigned';
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(node);
    });
    
    return grouped;
  }, [availableEquipment]);

  // Filter by search
  const filteredEquipment = useMemo(() => {
    if (!searchQuery.trim()) return availableEquipment;
    
    const query = searchQuery.toLowerCase();
    return availableEquipment.filter(node =>
      node.name.toLowerCase().includes(query) ||
      node.nodeType.toLowerCase().includes(query) ||
      node.gasType.toLowerCase().includes(query)
    );
  }, [availableEquipment, searchQuery]);

  const unassignedEquipment = useMemo(() => {
    return availableEquipment.filter(
      node => !node.buildingId && !node.floorId && !node.zoneId
    );
  }, [availableEquipment]);

  // Selection handlers
  const toggleNodeSelection = (nodeId: string) => {
    setSelectedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedNodeIds(new Set(filteredEquipment.map(n => n.id)));
  };

  const deselectAll = () => {
    setSelectedNodeIds(new Set());
  };

  const selectByLocation = (locationId: string, locationType: 'building' | 'floor' | 'zone') => {
    const nodes = availableEquipment.filter(node => {
      if (locationType === 'building') return node.buildingId === locationId;
      if (locationType === 'floor') return node.floorId === locationId;
      if (locationType === 'zone') return node.zoneId === locationId;
      return false;
    });
    
    setSelectedNodeIds(prev => {
      const next = new Set(prev);
      nodes.forEach(node => next.add(node.id));
      return next;
    });
  };

  const handleImport = async () => {
    if (selectedNodeIds.size === 0) return;
    
    setImporting(true);
    setError(null);
    
    try {
      await onImport(Array.from(selectedNodeIds));
      setSelectedNodeIds(new Set());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import equipment');
    } finally {
      setImporting(false);
    }
  };

  const toggleBuilding = (id: string) => {
    setExpandedBuildings(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleFloor = (id: string) => {
    setExpandedFloors(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getNodeIcon = (nodeType: string) => {
    switch (nodeType) {
      case 'source': return '🔵';
      case 'valve': return '🔴';
      case 'fitting': return '⚪';
      default: return '📦';
    }
  };

  const getGasColor = (gasType: string) => {
    const colors: Record<string, string> = {
      oxygen: 'text-blue-600',
      medical_air: 'text-gray-600',
      vacuum: 'text-yellow-600',
      nitrous_oxide: 'text-purple-600',
      nitrogen: 'text-green-600',
      carbon_dioxide: 'text-orange-600',
    };
    return colors[gasType] || 'text-gray-600';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Import Existing Equipment
          </DialogTitle>
          <DialogDescription>
            Select equipment from your site to add to this layout. Equipment is organized by building, floor, and zone.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading equipment...</span>
          </div>
        ) : (
          <>
            {/* Search and Actions */}
            <div className="space-y-3 border-b pb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search equipment by name, type, or gas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{selectedNodeIds.size}</span> of{' '}
                  <span className="font-medium">{availableEquipment.length}</span> equipment selected
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>
                    Clear Selection
                  </Button>
                </div>
              </div>
            </div>

            {/* Equipment List */}
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-2">
                {availableEquipment.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No equipment available</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      All equipment from this site is already in the layout.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Buildings */}
                    {buildings.map(building => {
                      const buildingEquipment = availableEquipment.filter(
                        n => n.buildingId === building.id && !n.floorId && !n.zoneId
                      );
                      const isExpanded = expandedBuildings.has(building.id);
                      const hasEquipment = buildingEquipment.length > 0 || building.floors.some(f => 
                        availableEquipment.some(n => n.floorId === f.id)
                      );

                      if (!hasEquipment) return null;

                      return (
                        <div key={building.id} className="border rounded-lg overflow-hidden">
                          {/* Building Header */}
                          <div className="bg-gray-50 p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1">
                                <button
                                  onClick={() => toggleBuilding(building.id)}
                                  className="p-1 hover:bg-gray-200 rounded"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </button>
                                <Building2 className="h-5 w-5 text-blue-600" />
                                <span className="font-semibold">{building.name}</span>
                                <span className="text-xs text-gray-500">
                                  ({availableEquipment.filter(n => n.buildingId === building.id).length} items)
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => selectByLocation(building.id, 'building')}
                              >
                                Select All
                              </Button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-3 space-y-3">
                              {/* Building-level equipment */}
                              {buildingEquipment.length > 0 && (
                                <div className="space-y-1">
                                  {buildingEquipment.map(node => (
                                    <EquipmentItem
                                      key={node.id}
                                      node={node}
                                      selected={selectedNodeIds.has(node.id)}
                                      onToggle={() => toggleNodeSelection(node.id)}
                                      getNodeIcon={getNodeIcon}
                                      getGasColor={getGasColor}
                                    />
                                  ))}
                                </div>
                              )}

                              {/* Floors */}
                              {building.floors.map(floor => {
                                const floorEquipment = availableEquipment.filter(
                                  n => n.floorId === floor.id && !n.zoneId
                                );
                                const isFloorExpanded = expandedFloors.has(floor.id);
                                const hasFloorEquipment = floorEquipment.length > 0 || floor.zones.some(z =>
                                  availableEquipment.some(n => n.zoneId === z.id)
                                );

                                if (!hasFloorEquipment) return null;

                                return (
                                  <div key={floor.id} className="border rounded-md overflow-hidden">
                                    {/* Floor Header */}
                                    <div className="bg-gray-50 p-2">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 flex-1">
                                          <button
                                            onClick={() => toggleFloor(floor.id)}
                                            className="p-0.5 hover:bg-gray-200 rounded"
                                          >
                                            {isFloorExpanded ? (
                                              <ChevronDown className="h-4 w-4" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4" />
                                            )}
                                          </button>
                                          <Layers className="h-4 w-4 text-green-600" />
                                          <span className="text-sm font-medium">
                                            Floor {floor.floorNumber}
                                            {floor.name && ` - ${floor.name}`}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            ({availableEquipment.filter(n => n.floorId === floor.id).length} items)
                                          </span>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => selectByLocation(floor.id, 'floor')}
                                        >
                                          Select All
                                        </Button>
                                      </div>
                                    </div>

                                    {isFloorExpanded && (
                                      <div className="p-2 space-y-2">
                                        {/* Floor-level equipment */}
                                        {floorEquipment.length > 0 && (
                                          <div className="space-y-1">
                                            {floorEquipment.map(node => (
                                              <EquipmentItem
                                                key={node.id}
                                                node={node}
                                                selected={selectedNodeIds.has(node.id)}
                                                onToggle={() => toggleNodeSelection(node.id)}
                                                getNodeIcon={getNodeIcon}
                                                getGasColor={getGasColor}
                                              />
                                            ))}
                                          </div>
                                        )}

                                        {/* Zones */}
                                        {floor.zones.map(zone => {
                                          const zoneEquipment = availableEquipment.filter(
                                            n => n.zoneId === zone.id
                                          );

                                          if (zoneEquipment.length === 0) return null;

                                          return (
                                            <div key={zone.id} className="border rounded-sm overflow-hidden">
                                              <div className="bg-gray-50 p-2">
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <Box className="h-3 w-3 text-purple-600" />
                                                    <span className="text-sm font-medium">{zone.name}</span>
                                                    <span className="text-xs text-gray-500">
                                                      ({zoneEquipment.length} items)
                                                    </span>
                                                  </div>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => selectByLocation(zone.id, 'zone')}
                                                  >
                                                    Select All
                                                  </Button>
                                                </div>
                                              </div>
                                              <div className="p-2 space-y-1">
                                                {zoneEquipment.map(node => (
                                                  <EquipmentItem
                                                    key={node.id}
                                                    node={node}
                                                    selected={selectedNodeIds.has(node.id)}
                                                    onToggle={() => toggleNodeSelection(node.id)}
                                                    getNodeIcon={getNodeIcon}
                                                    getGasColor={getGasColor}
                                                  />
                                                ))}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Unassigned Equipment */}
                    {unassignedEquipment.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Package className="h-5 w-5 text-gray-400" />
                              <span className="font-semibold">Unassigned / External</span>
                              <span className="text-xs text-gray-500">
                                ({unassignedEquipment.length} items)
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 space-y-1">
                          {unassignedEquipment.map(node => (
                            <EquipmentItem
                              key={node.id}
                              node={node}
                              selected={selectedNodeIds.has(node.id)}
                              onToggle={() => toggleNodeSelection(node.id)}
                              getNodeIcon={getNodeIcon}
                              getGasColor={getGasColor}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={importing}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedNodeIds.size === 0 || importing}
          >
            {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import {selectedNodeIds.size > 0 && `(${selectedNodeIds.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Equipment Item Component
function EquipmentItem({
  node,
  selected,
  onToggle,
  getNodeIcon,
  getGasColor,
}: {
  node: EquipmentNode;
  selected: boolean;
  onToggle: () => void;
  getNodeIcon: (type: string) => string;
  getGasColor: (gasType: string) => string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 rounded-md border transition-colors cursor-pointer',
        selected ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50'
      )}
      onClick={onToggle}
    >
      <Checkbox checked={selected} onCheckedChange={onToggle} />
      <span className="text-lg">{getNodeIcon(node.nodeType)}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{node.name}</div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="capitalize">{node.nodeType}</span>
          {node.gasType && (
            <>
              <span>•</span>
              <span className={cn('capitalize', getGasColor(node.gasType))}>
                {node.gasType.replace(/_/g, ' ')}
              </span>
            </>
          )}
          {node.valveType && (
            <>
              <span>•</span>
              <span className="capitalize">{node.valveType}</span>
            </>
          )}
          {node.fittingType && (
            <>
              <span>•</span>
              <span className="capitalize">{node.fittingType}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
