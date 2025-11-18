/**
 * Optimized Site Hierarchy Manager with React Query + Zustand
 * Much smoother UX with automatic caching and optimistic updates
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Building2, Plus, Layers, Box, ChevronDown, ChevronRight, 
  Loader2, Edit, Trash2
} from 'lucide-react';
import { useHierarchyStore } from '../../stores/hierarchy-store';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import type { SiteData } from './hierarchy/types';
import { useLayoutCounts } from '../../hooks/use-layout-counts';
import { useGasIndicators } from '../../hooks/use-gas-indicators';
import { useValveCounts } from '../../hooks/use-valve-counts';
import { ValveBadge } from './hierarchy/valve-badge';
import { LayoutBadge } from './LayoutBadge';
import { AllGasIndicators } from './AllGasIndicators';
import { QuickLayoutDialog } from './QuickLayoutDialog';
import { QuickValveDialog } from './QuickValveDialog';
import { LayoutSelectorDialog } from './LayoutSelectorDialog';
import { ValveListDialog } from './ValveListDialog';
import { useI18n } from '@/app/i18n-provider';

interface SiteHierarchyManagerOptimizedProps {
  siteData: any;
  siteId: string;
  organizationId: string;
  layouts: any[];
}

export function SiteHierarchyManagerOptimized({ siteData, siteId, organizationId, layouts }: SiteHierarchyManagerOptimizedProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  
  // Load real valve counts
  const { data: valveCounts = {} } = useValveCounts(siteId);
  
  // Load real layout counts
  const { data: layoutCounts = {} } = useLayoutCounts(siteId, layouts);
  
  // Load gas indicators per location
  const { data: gasData = { byLocation: {}, allSiteGases: [] } } = useGasIndicators(siteId);
  const gasIndicators = gasData.byLocation;
  const allSiteGases = gasData.allSiteGases;
  
  // Dialog states
  const [layoutDialog, setLayoutDialog] = useState<{ open: boolean; floorId?: string }>({ open: false });
  const [valveDialog, setValveDialog] = useState<{ 
    open: boolean; 
    locationId?: string; 
    locationType?: 'building' | 'floor' | 'zone';
  }>({ open: false });
  const [layoutSelectorDialog, setLayoutSelectorDialog] = useState<{
    open: boolean;
    locationId?: string;
    locationType?: 'site' | 'floor';
  }>({ open: false });
  const [valveListDialog, setValveListDialog] = useState<{
    open: boolean;
    locationId?: string;
    locationType?: 'building' | 'floor' | 'zone';
  }>({ open: false });
  
  // Zustand store for UI state (instant, no re-renders)
  const {
    expandedBuildings,
    expandedFloors,
    isEditMode,
    addingBuilding,
    addingFloorTo,
    addingZoneTo,
    toggleBuilding,
    toggleFloor,
    setEditMode,
    setAddingBuilding,
    setAddingFloorTo,
    setAddingZoneTo,
    cancelAllForms,
  } = useHierarchyStore();


  // React Query for data fetching (automatic caching!)
  const { data: hierarchyData, isLoading } = useQuery({
    queryKey: ['site-hierarchy', siteId],
    queryFn: async () => {
      const response = await fetch(`/api/synoptics/sites/${siteId}/hierarchy`);
      if (!response.ok) throw new Error('Failed to load hierarchy');
      return response.json();
    },
    initialData: siteData,
    staleTime: 30000, // Cache for 30 seconds
  });


  // Mutations with optimistic updates
  const createBuildingMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch('/api/synoptics/buildings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, siteId }),
      });
      if (!response.ok) throw new Error('Failed to create building');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-hierarchy', siteId] });
      setAddingBuilding(false);
      router.refresh();
    },
  });

  const createFloorMutation = useMutation({
    mutationFn: async ({ number, name, buildingId }: { number: number; name?: string; buildingId: string }) => {
      // Generate ordinal name if not provided
      const getOrdinalName = (num: number) => {
        const absNum = Math.abs(num);
        if (absNum === 0) {
          return t('synoptics.hierarchy.floor.auto.ground');
        }

        if (num < 0) {
          return `${t('synoptics.hierarchy.floor.auto.basementPrefix')}${absNum}`;
        }

        return `${t('synoptics.hierarchy.floor.auto.abovePrefix')}${absNum}`;
      };
      
      const response = await fetch('/api/synoptics/floors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          floorNumber: number,
          name: name || getOrdinalName(number),
          buildingId 
        }),
      });
      if (!response.ok) throw new Error('Failed to create floor');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-hierarchy', siteId] });
      setAddingFloorTo(null);
      router.refresh();
    },
  });

  const createZoneMutation = useMutation({
    mutationFn: async ({ name, floorId }: { name: string; floorId: string }) => {
      const response = await fetch('/api/synoptics/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, floorId }),
      });
      if (!response.ok) throw new Error('Failed to create zone');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-hierarchy', siteId] });
      setAddingZoneTo(null);
      router.refresh();
    },
  });

  const deleteBuildingMutation = useMutation({
    mutationFn: async (buildingId: string) => {
      const response = await fetch(`/api/synoptics/buildings?buildingId=${buildingId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete building');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-hierarchy', siteId] });
      router.refresh();
    },
  });

  const deleteFloorMutation = useMutation({
    mutationFn: async (floorId: string) => {
      const response = await fetch(`/api/synoptics/floors?floorId=${floorId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete floor');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-hierarchy', siteId] });
      router.refresh();
    },
  });

  const deleteZoneMutation = useMutation({
    mutationFn: async (zoneId: string) => {
      const response = await fetch(`/api/synoptics/zones?zoneId=${zoneId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete zone');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-hierarchy', siteId] });
      router.refresh();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const buildingCount = hierarchyData?.buildings?.length || 0;
  const buildingLabel =
    buildingCount === 1
      ? t('synoptics.hierarchy.header.building.singular')
      : t('synoptics.hierarchy.header.building.plural');

  return (
    <div className="space-y-4">
      {/* Header with Site Info */}
      <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{siteData.name}</h2>
              <LayoutBadge
                count={layoutCounts[siteId] || 0}
                size="md"
                showAddButton={isEditMode}
                onClick={() => {
                  if ((layoutCounts[siteId] || 0) > 0) {
                    setLayoutSelectorDialog({ open: true, locationId: siteId, locationType: 'site' });
                  }
                }}
                onAdd={() => setLayoutDialog({ open: true })}
              />
            </div>
            <p className="text-sm text-gray-600">
              {buildingCount} {buildingLabel}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(!isEditMode)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {isEditMode
                ? t('synoptics.hierarchy.header.done')
                : t('synoptics.hierarchy.header.edit')}
            </Button>
            
            {isEditMode && (
              <Button
                size="sm"
                onClick={() => setAddingBuilding(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('synoptics.hierarchy.header.addBuilding')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Add Building Form */}
      {addingBuilding && (
        <InlineForm
          placeholder={t('synoptics.hierarchy.inline.buildingPlaceholder')}
          onSubmit={(name) => createBuildingMutation.mutate(name)}
          onCancel={() => setAddingBuilding(false)}
          isSubmitting={createBuildingMutation.isPending}
        />
      )}

      {/* Buildings List */}
      <div className="space-y-3">
        {hierarchyData?.buildings?.map((building: any) => {
          const isExpanded = expandedBuildings.has(building.id);
          
          return (
            <div key={building.id} className="border rounded-lg bg-white">
              {/* Building Header */}
              <div className="p-4 flex items-center justify-between">
                <button
                  onClick={() => toggleBuilding(building.id)}
                  className="flex items-center gap-3 flex-1 text-left hover:bg-gray-50 -m-2 p-2 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                  <Building2 className="h-5 w-5 text-purple-600" />
                  <div>
                    <h3 className="font-semibold">{building.name}</h3>
                    <p className="text-sm text-gray-500">
                      {(building.floors?.length || 0)}{' '}
                      {(building.floors?.length || 0) === 1
                        ? t('synoptics.hierarchy.header.floor.singular')
                        : t('synoptics.hierarchy.header.floor.plural')}
                    </p>
                  </div>
                </button>
                
                <div className="flex items-center gap-3">
                  {/* Valves and Gases */}
                  <div className="flex items-center gap-2">
                    <ValveBadge
                      locationId={building.id}
                      count={valveCounts[building.id] || 0}
                      isLoading={false}
                      onClick={() => {
                        if ((valveCounts[building.id] || 0) > 0) {
                          setValveListDialog({ open: true, locationId: building.id, locationType: 'building' });
                        }
                      }}
                    />
                    {isEditMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        title="Add valve"
                        onClick={() => setValveDialog({ 
                          open: true, 
                          locationId: building.id, 
                          locationType: 'building' 
                        })}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                    <AllGasIndicators
                      activeGases={gasIndicators[building.id] || []}
                      allSiteGases={allSiteGases}
                      size="md"
                    />
                  </div>
                  
                  {isEditMode && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAddingFloorTo(building.id);
                          if (!expandedBuildings.has(building.id)) {
                            toggleBuilding(building.id); // Auto-expand
                          }
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {t('synoptics.hierarchy.inline.addFloorButton')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title={t('synoptics.hierarchy.inline.editBuildingTooltip')}
                        onClick={() => {
                          router.push(`/synoptics/buildings/${building.id}/edit`);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          if (!window.confirm(t('synoptics.hierarchy.deleteBuilding.confirm'))) return;
                          deleteBuildingMutation.mutate(building.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  {/* Add Floor Form */}
                  {addingFloorTo === building.id && (
                    <div className="ml-8">
                      <FloorInlineForm
                        onSubmit={(data) => createFloorMutation.mutate({ ...data, buildingId: building.id })}
                        onCancel={() => setAddingFloorTo(null)}
                        isSubmitting={createFloorMutation.isPending}
                      />
                    </div>
                  )}

                  {/* Floors - sorted by number descending (highest floor at top, negative floors at bottom) */}
                  {building.floors
                    ?.slice()
                    .sort((a: any, b: any) => {
                      const numA = typeof a.floorNumber === 'number' ? a.floorNumber : a.number || 0;
                      const numB = typeof b.floorNumber === 'number' ? b.floorNumber : b.number || 0;
                      // Sort descending: 5, 4, 3, 2, 1, 0, -1, -2 (highest at top)
                      return numB - numA;
                    })
                    .map((floor: any) => {
                    const isFloorExpanded = expandedFloors.has(floor.id);
                    
                    return (
                      <div key={floor.id} className="ml-8 border rounded-lg">
                        <div className="p-3 flex items-center justify-between">
                          <button
                            onClick={() => toggleFloor(floor.id)}
                            className="flex items-center gap-2 hover:bg-gray-50 -m-1 p-1 rounded flex-1 text-left"
                          >
                            {isFloorExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                            <Layers className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-sm">{floor.name}</span>
                            <Badge variant="secondary" className="text-xs ml-2">
                              {floor.zones?.length || 0} zone{floor.zones?.length !== 1 ? 's' : ''}
                            </Badge>
                          </button>
                          
                          <div className="flex items-center gap-2">
                            <LayoutBadge
                              count={layoutCounts[floor.id] || 0}
                              size="sm"
                              showAddButton={isEditMode}
                              onClick={() => {
                                if ((layoutCounts[floor.id] || 0) > 0) {
                                  setLayoutSelectorDialog({ open: true, locationId: floor.id, locationType: 'floor' });
                                }
                              }}
                              onAdd={() => setLayoutDialog({ open: true, floorId: floor.id })}
                            />
                            
                            {/* Valves and Gases */}
                            <div className="flex items-center gap-1.5">
                              <ValveBadge
                                locationId={floor.id}
                                count={valveCounts[floor.id] || 0}
                                size="sm"
                                isLoading={false}
                                onClick={() => {
                                  if ((valveCounts[floor.id] || 0) > 0) {
                                    setValveListDialog({ open: true, locationId: floor.id, locationType: 'floor' });
                                  }
                                }}
                              />
                              {isEditMode && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 px-1.5"
                                  title="Add valve"
                                  onClick={() => setValveDialog({ 
                                    open: true, 
                                    locationId: floor.id, 
                                    locationType: 'floor' 
                                  })}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              )}
                              <AllGasIndicators
                                activeGases={gasIndicators[floor.id] || []}
                                allSiteGases={allSiteGases}
                                size="sm"
                              />
                            </div>
                            
                            {isEditMode && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setAddingZoneTo(floor.id);
                                    if (!isFloorExpanded) {
                                      toggleFloor(floor.id); // Auto-expand
                                    }
                                  }}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  {t('synoptics.hierarchy.inline.addZoneButton')}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title={t('synoptics.hierarchy.inline.editFloorTooltip')}
                                  onClick={() => {
                                    router.push(`/synoptics/buildings/${building.id}/floors/${floor.id}/edit`);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => {
                                    if (!window.confirm(t('synoptics.hierarchy.deleteFloor.confirm'))) return;
                                    deleteFloorMutation.mutate(floor.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Zones */}
                        {isFloorExpanded && (
                          <div className="px-3 pb-3 space-y-2">
                            {/* Add Zone Form */}
                            {addingZoneTo === floor.id && (
                              <div className="ml-6">
                                <InlineForm
                                  placeholder={t('synoptics.hierarchy.inline.zonePlaceholder')}
                                  onSubmit={(name) => createZoneMutation.mutate({ name, floorId: floor.id })}
                                  onCancel={() => setAddingZoneTo(null)}
                                  isSubmitting={createZoneMutation.isPending}
                                />
                              </div>
                            )}

                            {floor.zones?.map((zone: any) => (
                              <div key={zone.id} className="ml-6 p-3 border rounded bg-white">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Box className="h-4 w-4 text-orange-600" />
                                    <span className="text-sm font-medium">{zone.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <ValveBadge
                                      locationId={zone.id}
                                      count={valveCounts[zone.id] || 0}
                                      size="sm"
                                      isLoading={false}
                                      onClick={() => {
                                        if ((valveCounts[zone.id] || 0) > 0) {
                                          setValveListDialog({ open: true, locationId: zone.id, locationType: 'zone' });
                                        }
                                      }}
                                    />
                                    {isEditMode && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 px-1.5"
                                        title="Add valve"
                                        onClick={() => setValveDialog({ 
                                          open: true, 
                                          locationId: zone.id, 
                                          locationType: 'zone' 
                                        })}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    )}
                                    <AllGasIndicators
                                      activeGases={gasIndicators[zone.id] || []}
                                      allSiteGases={allSiteGases}
                                      size="sm"
                                    />
                                    {isEditMode && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 px-1.5"
                                        title={t('synoptics.hierarchy.inline.editZoneTooltip')}
                                        onClick={() => {
                                          router.push(`/synoptics/zones/${zone.id}/edit`);
                                        }}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    )}
                                    {isEditMode && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700"
                                        onClick={() => {
                                          if (!window.confirm(t('synoptics.hierarchy.deleteZone.confirm'))) return;
                                          deleteZoneMutation.mutate(zone.id);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
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
      </div>

      {/* Quick Dialogs */}
      <QuickLayoutDialog
        open={layoutDialog.open}
        onOpenChange={(open) => setLayoutDialog({ open, floorId: open ? layoutDialog.floorId : undefined })}
        siteId={siteId}
        floorId={layoutDialog.floorId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['layout-counts', siteId] });
          queryClient.invalidateQueries({ queryKey: ['site-hierarchy', siteId] });
          // Small delay to ensure DB write completes before refresh
          setTimeout(() => {
            router.refresh();
          }, 100);
        }}
      />

      {valveDialog.locationId && valveDialog.locationType && (
        <QuickValveDialog
          open={valveDialog.open}
          onOpenChange={(open) => setValveDialog({ open, locationId: open ? valveDialog.locationId : undefined, locationType: open ? valveDialog.locationType : undefined })}
          locationId={valveDialog.locationId}
          locationType={valveDialog.locationType}
          siteId={siteId}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['valve-counts', siteId] });
            queryClient.invalidateQueries({ queryKey: ['gas-indicators', siteId] });
            queryClient.invalidateQueries({ queryKey: ['valves-list'] });
            router.refresh();
          }}
        />
      )}

      {/* Selector Dialogs */}
      {layoutSelectorDialog.locationId && layoutSelectorDialog.locationType && (
        <LayoutSelectorDialog
          open={layoutSelectorDialog.open}
          onOpenChange={(open) => setLayoutSelectorDialog({ open })}
          layouts={layouts}
          locationId={layoutSelectorDialog.locationId}
          locationType={layoutSelectorDialog.locationType}
        />
      )}

      {valveListDialog.locationId && valveListDialog.locationType && (
        <ValveListDialog
          open={valveListDialog.open}
          onOpenChange={(open) => setValveListDialog({ open })}
          locationId={valveListDialog.locationId}
          locationType={valveListDialog.locationType}
          organizationId={organizationId}
          siteId={siteId}
        />
      )}
    </div>
  );
}

// Simple inline form component
function InlineForm({ 
  placeholder, 
  onSubmit, 
  onCancel, 
  isSubmitting 
}: { 
  placeholder: string; 
  onSubmit: (value: string) => void; 
  onCancel: () => void; 
  isSubmitting: boolean;
}) {
  const [value, setValue] = useState('');
  const { t } = useI18n();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={isSubmitting}
        autoFocus
      />
      <Button type="submit" size="sm" disabled={isSubmitting || !value.trim()}>
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          t('synoptics.hierarchy.inline.addButton')
        )}
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={isSubmitting}>
        {t('common.cancel')}
      </Button>
    </form>
  );
}

// Floor inline form with number (required) and name (optional)
function FloorInlineForm({ 
  onSubmit, 
  onCancel, 
  isSubmitting 
}: { 
  onSubmit: (data: { number: number; name?: string }) => void; 
  onCancel: () => void; 
  isSubmitting: boolean;
}) {
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const { t } = useI18n();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const floorNumber = parseInt(number);
    if (!isNaN(floorNumber)) {
      onSubmit({ 
        number: floorNumber, 
        name: name.trim() || undefined 
      });
      setNumber('');
      setName('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="number"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
        placeholder={t('synoptics.hierarchy.inline.floorNumberPlaceholder')}
        disabled={isSubmitting}
        autoFocus
        className="w-32"
      />
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('synoptics.hierarchy.inline.floorNamePlaceholder')}
        disabled={isSubmitting}
        className="flex-1"
      />
      <Button type="submit" size="sm" disabled={isSubmitting || !number.trim()}>
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          t('synoptics.hierarchy.inline.addButton')
        )}
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={isSubmitting}>
        {t('common.cancel')}
      </Button>
    </form>
  );
}
