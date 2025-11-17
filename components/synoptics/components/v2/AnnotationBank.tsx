'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, Layers, MapPin, X, Search, Trash2 } from 'lucide-react';
import { Annotation } from './AnnotationLayer';

interface AnnotationBankProps {
  siteId: string;
  layoutId: string;
  annotations: Annotation[];
  onRefresh: () => void;
  onClose: () => void;
}

interface Building {
  id: string;
  name: string;
  code: string;
}

interface Floor {
  id: string;
  name: string;
  code: string;
  buildingId: string;
}

interface Zone {
  id: string;
  name: string;
  code: string;
  floorId: string;
}

export function AnnotationBank({ siteId, layoutId, annotations, onRefresh, onClose }: AnnotationBankProps) {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load hierarchy data
  useEffect(() => {
    const loadHierarchy = async () => {
      if (!siteId) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/synoptics/sites/${siteId}/hierarchy`);
        if (response.ok) {
          const data = await response.json();
          
          // Buildings
          const buildingsData = data.buildings || [];
          setBuildings(buildingsData);
          
          // Floors - only use real floors coming from the site
          const floorsFromRoot = (data.floors || []) as Floor[];
          const floorsFromBuildings: Floor[] = buildingsData.flatMap((b: any) =>
            (b.floors || []).map((f: any) => ({
              id: f.id,
              name: f.name,
              code: f.code ?? String(f.floorNumber ?? ''),
              buildingId: b.id,
            }))
          );

          const mergedFloors: Floor[] = floorsFromRoot.length > 0 ? floorsFromRoot : floorsFromBuildings;
          setFloors(mergedFloors);
          
          // Zones - load from API, fallback to hierarchy data
          const zonesResponse = await fetch(`/api/synoptics/sites/${siteId}/zones`);
          if (zonesResponse.ok) {
            const zonesData = await zonesResponse.json();
            console.log('✅ Zones loaded:', zonesData);
            setZones(zonesData || []);
          } else {
            console.log('⚠️ Zones API failed, using hierarchy fallback');
            // Fallback if zones endpoint is not available
            if (Array.isArray(data.zones) && data.zones.length > 0) {
              setZones(data.zones || []);
            } else {
              const zonesFromHierarchy: Zone[] = buildingsData.flatMap((b: any) =>
                (b.floors || []).flatMap((f: any) =>
                  (f.zones || []).map((z: any) => ({
                    id: z.id,
                    name: z.name,
                    code: z.code ?? '',
                    floorId: f.id,
                  }))
                )
              );
              setZones(zonesFromHierarchy);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load hierarchy:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHierarchy();
  }, [siteId]);

  const handleAddToLayout = async (type: 'building' | 'floor' | 'zone', itemId: string, title: string) => {
    try {
      const response = await fetch('/api/synoptics/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layoutId,
          type,
          title,
          position: { x: 100, y: 100 }, // Position initiale
          size: type === 'zone' ? { width: 300, height: 200 } : undefined,
          color: type === 'zone' ? '#93c5fd' : undefined,
        }),
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to add annotation:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this annotation?')) return;

    try {
      const response = await fetch(`/api/synoptics/annotations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to delete annotation:', error);
    }
  };

  const filteredBuildings = buildings.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFloors = floors.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredZones = zones.filter(z =>
    z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    z.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white border-l border-gray-200 w-80 h-screen max-h-screen flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Annotation Library</h2>
          <Button onClick={onClose} variant="ghost" size="sm" className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Instructions - Fixed */}
      <div className="p-4 bg-blue-50 border-b border-blue-200 text-sm text-blue-700 flex-shrink-0">
        <p className="font-medium mb-1">💡 How to add?</p>
        <p className="text-xs">Click "Add" then move the annotation on the canvas</p>
      </div>

      {/* Content - Scrollable */}
      <ScrollArea className="flex-1 min-h-0 h-full">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : (
          <>
            {/* Buildings */}
            <div className="border-b border-gray-200">
              <div className="p-3 bg-gray-50 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-600" />
                <span className="font-semibold text-sm text-gray-700">Buildings ({filteredBuildings.length})</span>
              </div>
              <div className="divide-y divide-gray-100">
                {filteredBuildings.map((building) => {
                  const isAdded = annotations.some(a => a.type === 'building' && a.title === building.name);
                  return (
                    <div key={building.id} className="p-3 hover:bg-gray-50 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">{building.name}</div>
                        <div className="text-xs text-gray-500">{building.code}</div>
                      </div>
                      <Button
                        onClick={() => handleAddToLayout('building', building.id, building.name)}
                        size="sm"
                        variant={isAdded ? 'outline' : 'default'}
                        className="ml-2 h-7 text-xs"
                        disabled={isAdded}
                      >
                        {isAdded ? 'Added' : 'Add'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Floors */}
            <div className="border-b border-gray-200">
              <div className="p-3 bg-gray-50 flex items-center gap-2">
                <Layers className="h-4 w-4 text-gray-600" />
                <span className="font-semibold text-sm text-gray-700">Floors ({filteredFloors.length})</span>
              </div>
              <div className="divide-y divide-gray-100">
                {filteredFloors.map((floor) => {
                  const building = buildings.find(b => b.id === floor.buildingId);
                  const isAdded = annotations.some(a => a.type === 'floor' && a.title === floor.name);
                  return (
                    <div key={floor.id} className="p-3 hover:bg-gray-50 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">{floor.name}</div>
                        <div className="text-xs text-gray-500">
                          {floor.code} • {building?.name || 'N/A'}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAddToLayout('floor', floor.id, floor.name)}
                        size="sm"
                        variant={isAdded ? 'outline' : 'default'}
                        className="ml-2 h-7 text-xs"
                        disabled={isAdded}
                      >
                        {isAdded ? 'Added' : 'Add'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Zones */}
            <div className="border-b border-gray-200">
              <div className="p-3 bg-gray-50 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-600" />
                <span className="font-semibold text-sm text-gray-700">Zones ({filteredZones.length})</span>
              </div>
              <div className="divide-y divide-gray-100">
                {filteredZones.map((zone) => {
                  const floor = floors.find(f => f.id === zone.floorId);
                  const isAdded = annotations.some(a => a.type === 'zone' && a.title === zone.name);
                  return (
                    <div key={zone.id} className="p-3 hover:bg-gray-50 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">{zone.name}</div>
                        <div className="text-xs text-gray-500">
                          {zone.code} • {floor?.name || 'N/A'}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAddToLayout('zone', zone.id, zone.name)}
                        size="sm"
                        variant={isAdded ? 'outline' : 'default'}
                        className="ml-2 h-7 text-xs"
                        disabled={isAdded}
                      >
                        {isAdded ? 'Added' : 'Add'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </ScrollArea>

      {/* Annotations already added */}
      {annotations.length > 0 && (
        <div className="border-t-2 border-gray-300 bg-gray-50">
          <div className="p-3 border-b border-gray-200">
            <span className="font-semibold text-sm text-gray-700">On the canvas ({annotations.length})</span>
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-gray-200">
            {annotations.map((annotation) => (
              <div key={annotation.id} className="p-3 hover:bg-gray-100 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">{annotation.title}</div>
                  <div className="text-xs text-gray-500 capitalize">{annotation.type}</div>
                </div>
                <Button
                  onClick={() => handleDelete(annotation.id)}
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
