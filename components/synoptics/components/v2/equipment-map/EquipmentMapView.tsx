'use client';

import { useEffect, useRef } from 'react';
import mapboxgl, { MapboxGeoJSONFeature } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from 'lucide-react';
import { MapGasLegend } from './MapGasLegend';

const STATUS_PALETTE: Record<string, { color: string; badge: string; muted: string }> = {
  open: { color: '#16a34a', badge: 'bg-emerald-100 text-emerald-700', muted: 'bg-emerald-50 text-emerald-400' },
  closed: { color: '#dc2626', badge: 'bg-rose-100 text-rose-700', muted: 'bg-rose-50 text-rose-400' },
  maintenance: { color: '#f59e0b', badge: 'bg-amber-100 text-amber-700', muted: 'bg-amber-50 text-amber-400' },
  alarm: { color: '#fb923c', badge: 'bg-orange-100 text-orange-700', muted: 'bg-orange-50 text-orange-400' },
  unknown: { color: '#6b7280', badge: 'bg-slate-100 text-slate-600', muted: 'bg-slate-50 text-slate-400' },
};

const DEFAULT_ZOOM = 13;

const GAS_COLORS: Record<string, string> = {
  oxygen: '#ef4444',
  medical_air: '#9333ea',
  vacuum: '#22c55e',
  nitrogen: '#3b82f6',
  nitrous_oxide: '#f97316',
  carbon_dioxide: '#6b7280',
  co2: '#6b7280',
  compressed_air: '#8b5cf6',
};

interface EquipmentMapViewProps {
  isLoading: boolean;
  isError: boolean;
  featureCollection: GeoJSON.FeatureCollection;
  equipmentWithCoordsCount: number;
  mapCenter: [number, number];
  onMapReady: (ready: boolean) => void;
  mapReady: boolean;
}

function humanise(text: string): string {
  return text
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function toLngLatTuple(coords: unknown): [number, number] | undefined {
  if (!Array.isArray(coords) || coords.length < 2) return undefined;
  const lng = typeof coords[0] === 'number' ? coords[0] : undefined;
  const lat = typeof coords[1] === 'number' ? coords[1] : undefined;
  if (lng === undefined || lat === undefined) return undefined;
  return [lng, lat];
}

export function EquipmentMapView({
  isLoading,
  isError,
  featureCollection,
  equipmentWithCoordsCount,
  mapCenter,
  onMapReady,
  mapReady,
}: EquipmentMapViewProps) {
  console.log('[EquipmentMapView] Component rendering');
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  // Initialize map
  useEffect(() => {
    console.log('[EquipmentMapView] Init effect triggered');
    console.log('[EquipmentMapView] containerRef.current:', !!containerRef.current);
    console.log('[EquipmentMapView] mapRef.current:', !!mapRef.current);
    console.log('[EquipmentMapView] mapCenter:', mapCenter);
    console.log('[EquipmentMapView] featureCollection features:', featureCollection.features.length);
    
    // Small delay to ensure container is fully rendered
    const initTimer = setTimeout(() => {
      console.log('[EquipmentMapView] Timeout fired, checking conditions...');
      
      if (!containerRef.current) {
        console.error('[EquipmentMapView] Container ref not available');
        return;
      }
      
      if (mapRef.current) {
        console.log('[EquipmentMapView] Map already initialized, skipping');
        return;
      }

      const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      console.log('[EquipmentMapView] Mapbox token exists:', !!token);
      
      if (!token) {
        console.error('[EquipmentMapView] Mapbox access token missing');
        return;
      }
      
      mapboxgl.accessToken = token;
      console.log('[EquipmentMapView] Creating map instance...');

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: mapCenter,
        zoom: DEFAULT_ZOOM,
      });
      
      console.log('[EquipmentMapView] Map instance created');

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    map.on('load', () => {
      console.log('[EquipmentMapView] Map loaded successfully');
      console.log('[EquipmentMapView] Map container size:', containerRef.current?.offsetWidth, 'x', containerRef.current?.offsetHeight);
      
      // Force resize to ensure map renders
      setTimeout(() => {
        map.resize();
        console.log('[EquipmentMapView] Map resized');
      }, 100);
      
      onMapReady(true);
      
      // Add source
      console.log('[EquipmentMapView] Adding equipment source with', featureCollection.features.length, 'features');
      map.addSource('equipment', {
        type: 'geojson',
        data: featureCollection,
        cluster: true,
        clusterMaxZoom: 15,
        clusterRadius: 44,
      });
      console.log('[EquipmentMapView] Source added');

      // Cluster circles
      map.addLayer({
        id: 'equipment-clusters',
        type: 'circle',
        source: 'equipment',
        filter: ['has', 'point_count'],
        paint: {
          'circle-radius': ['step', ['get', 'point_count'], 20, 20, 26, 100, 32],
          'circle-color': '#1d4ed8',
          'circle-opacity': 0.15,
          'circle-stroke-color': '#2563eb',
          'circle-stroke-width': 2,
        },
      });

      // Cluster count labels
      map.addLayer({
        id: 'equipment-cluster-count',
        type: 'symbol',
        source: 'equipment',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#1f2937',
        },
      });

      // Unclustered equipment points
      console.log('[EquipmentMapView] Adding equipment layers');
      map.addLayer({
        id: 'equipment-unclustered',
        type: 'circle',
        source: 'equipment',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': [
            'case',
            ['==', ['get', 'nodeType'], 'valve'],
            0.1,
            8,
          ],
          'circle-color': [
            'match',
            ['get', 'status'],
            'open', STATUS_PALETTE.open.color,
            'closed', STATUS_PALETTE.closed.color,
            'maintenance', STATUS_PALETTE.maintenance.color,
            'alarm', STATUS_PALETTE.alarm.color,
            STATUS_PALETTE.unknown.color,
          ],
          'circle-opacity': 0.85,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });

      map.addLayer({
        id: 'equipment-valves-circle',
        type: 'circle',
        source: 'equipment',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'nodeType'], 'valve']],
        paint: {
          'circle-radius': 10,
          'circle-color': [
            'match',
            ['get', 'gasType'],
            'oxygen', GAS_COLORS.oxygen,
            'medical_air', GAS_COLORS.medical_air,
            'vacuum', GAS_COLORS.vacuum,
            'nitrogen', GAS_COLORS.nitrogen,
            'nitrous_oxide', GAS_COLORS.nitrous_oxide,
            'carbon_dioxide', GAS_COLORS.carbon_dioxide,
            'co2', GAS_COLORS.co2,
            'compressed_air', GAS_COLORS.compressed_air,
            GAS_COLORS.carbon_dioxide,
          ],
          'circle-opacity': 0.9,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });

      const valveImage = new Image(40, 40);
      valveImage.onload = () => {
        if (!map.hasImage('valve-icon')) {
          map.addImage('valve-icon', valveImage, { pixelRatio: 2 });
        }

        map.addLayer({
          id: 'equipment-valves-icon',
          type: 'symbol',
          source: 'equipment',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'nodeType'], 'valve']],
          layout: {
            'icon-image': 'valve-icon',
            'icon-size': 0.4,
            'icon-allow-overlap': true,
          },
        });
      };
      valveImage.src = '/valve.svg';

      console.log('[EquipmentMapView] All layers added successfully');

      // Cluster click handler
      map.on('click', 'equipment-clusters', (event) => {
        const features = map.queryRenderedFeatures(event.point, { layers: ['equipment-clusters'] }) as MapboxGeoJSONFeature[];
        const clusterFeature = features?.[0];
        if (!clusterFeature) return;
        const rawClusterId = clusterFeature.properties?.cluster_id;
        const source = map.getSource('equipment') as mapboxgl.GeoJSONSource & {
          getClusterExpansionZoom: (id: number, callback: (err: Error | null, zoom: number) => void) => void;
        };
        if (!source || typeof rawClusterId !== 'number' || Number.isNaN(rawClusterId)) return;
        const clusterId = rawClusterId;
        source.getClusterExpansionZoom(clusterId, (error, zoom) => {
          if (error || zoom == null) return;
          const geometry = clusterFeature.geometry;
          const coords = geometry?.type === 'Point' ? toLngLatTuple(geometry.coordinates) : undefined;
          if (coords) {
            map.easeTo({ center: coords, zoom });
            return;
          }
          map.easeTo({ zoom });
        });
      });

      const handleEquipmentClick = async (event: any) => {
        const selectedFeature = event.features?.[0] as MapboxGeoJSONFeature | undefined;
        if (!selectedFeature || selectedFeature.geometry.type !== 'Point') {
          return;
        }
        const coords = toLngLatTuple(selectedFeature.geometry.coordinates);
        if (!coords) return;
        const props = selectedFeature.properties as Record<string, string>;

        // Initial popup with loading state
        let html = `
          <div class="min-w-[200px] space-y-2">
            <div class="text-sm font-semibold text-gray-900">${props.name ?? 'Equipment'}</div>
            <div class="flex items-center gap-2 text-xs">
              <span class="font-medium text-gray-700">${props.gasType ?? 'Unknown gas'}</span>
              <span class="text-gray-400">·</span>
              <span class="text-gray-500">${humanise(props.nodeType ?? 'equipment')}</span>
            </div>
            ${props.buildingName ? `<div class="text-xs text-gray-500">📍 ${props.buildingName}${props.floorName ? ` · ${props.floorName}` : ''}</div>` : ''}
            <div class="text-xs text-gray-400 italic">Loading photo...</div>
          </div>
        `;

        if (!popupRef.current) {
          popupRef.current = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: true,
            maxWidth: '300px',
          });
        }
        popupRef.current.setLngLat(coords).setHTML(html).addTo(map);

        // Try to load equipment photo
        if (props.elementId && props.nodeType) {
          try {
            console.log('[EquipmentMapView] Loading media for:', props.nodeType, props.elementId);
            const mediaResponse = await fetch(`/api/synoptics/${props.nodeType}s/${props.elementId}/media`);
            console.log('[EquipmentMapView] Media response status:', mediaResponse.status);

            if (mediaResponse.ok) {
              const media = await mediaResponse.json();
              console.log('[EquipmentMapView] Media data:', media);
              const firstImage = media.find((m: any) => m.fileType?.startsWith('image/'));

              if (firstImage) {
                console.log('[EquipmentMapView] Found image:', firstImage.fileUrl);
                html = `
                  <div class="min-w-[200px] space-y-2">
                    <div class="text-sm font-semibold text-gray-900">${props.name ?? 'Equipment'}</div>
                    <img
                      src="${firstImage.fileUrl}"
                      alt="${props.name}"
                      class="w-full h-32 object-cover rounded border border-gray-200"
                      onerror="this.style.display='none'"
                    />
                    <div class="flex items-center gap-2 text-xs">
                      <span class="font-medium text-gray-700">${props.gasType ?? 'Unknown gas'}</span>
                      <span class="text-gray-400">·</span>
                      <span class="text-gray-500">${humanise(props.nodeType ?? 'equipment')}</span>
                    </div>
                    ${props.buildingName ? `<div class="text-xs text-gray-500">📍 ${props.buildingName}${props.floorName ? ` · ${props.floorName}` : ''}</div>` : ''}
                  </div>
                `;
                popupRef.current.setHTML(html);
              } else {
                console.log('[EquipmentMapView] No image found in media');
                // No photo, show simplified version
                html = `
                  <div class="min-w-[200px] space-y-2">
                    <div class="text-sm font-semibold text-gray-900">${props.name ?? 'Equipment'}</div>
                    <div class="flex items-center gap-2 text-xs">
                      <span class="font-medium text-gray-700">${props.gasType ?? 'Unknown gas'}</span>
                      <span class="text-gray-400">·</span>
                      <span class="text-gray-500">${humanise(props.nodeType ?? 'equipment')}</span>
                    </div>
                    ${props.buildingName ? `<div class="text-xs text-gray-500">📍 ${props.buildingName}${props.floorName ? ` · ${props.floorName}` : ''}</div>` : ''}
                  </div>
                `;
                popupRef.current.setHTML(html);
              }
            } else {
              // API error, show simplified version
              console.warn('[EquipmentMapView] Media API error:', mediaResponse.status);
              html = `
                <div class="min-w-[200px] space-y-2">
                  <div class="text-sm font-semibold text-gray-900">${props.name ?? 'Equipment'}</div>
                  <div class="flex items-center gap-2 text-xs">
                    <span class="font-medium text-gray-700">${props.gasType ?? 'Unknown gas'}</span>
                    <span class="text-gray-400">·</span>
                    <span class="text-gray-500">${humanise(props.nodeType ?? 'equipment')}</span>
                  </div>
                  ${props.buildingName ? `<div class="text-xs text-gray-500">📍 ${props.buildingName}${props.floorName ? ` · ${props.floorName}` : ''}</div>` : ''}
                </div>
              `;
              popupRef.current.setHTML(html);
            }
          } catch (error) {
            console.error('[EquipmentMapView] Failed to load equipment photo:', error);
            // Show simplified version on error
            html = `
              <div class="min-w-[200px] space-y-2">
                <div class="text-sm font-semibold text-gray-900">${props.name ?? 'Equipment'}</div>
                <div class="flex items-center gap-2 text-xs">
                  <span class="font-medium text-gray-700">${props.gasType ?? 'Unknown gas'}</span>
                  <span class="text-gray-400">·</span>
                  <span class="text-gray-500">${humanise(props.nodeType ?? 'equipment')}</span>
                </div>
                ${props.buildingName ? `<div class="text-xs text-gray-500">📍 ${props.buildingName}${props.floorName ? ` · ${props.floorName}` : ''}</div>` : ''}
              </div>
            `;
            popupRef.current.setHTML(html);
          }
        } else {
          // No elementId or nodeType, show basic info
          console.log('[EquipmentMapView] No elementId or nodeType, showing basic info');
          html = `
            <div class="min-w-[200px] space-y-2">
              <div class="text-sm font-semibold text-gray-900">${props.name ?? 'Equipment'}</div>
              <div class="flex items-center gap-2 text-xs">
                <span class="font-medium text-gray-700">${props.gasType ?? 'Unknown gas'}</span>
                <span class="text-gray-400">·</span>
                <span class="text-gray-500">${humanise(props.nodeType ?? 'equipment')}</span>
              </div>
              ${props.buildingName ? `<div class="text-xs text-gray-500">📍 ${props.buildingName}${props.floorName ? ` · ${props.floorName}` : ''}</div>` : ''}
            </div>
          `;
          popupRef.current.setHTML(html);
        }
      };

      map.on('click', 'equipment-unclustered', handleEquipmentClick);
      map.on('click', 'equipment-valves-circle', handleEquipmentClick);
      map.on('click', 'equipment-valves-icon', handleEquipmentClick);

      const handleMouseEnter = () => {
        map.getCanvas().style.cursor = 'pointer';
      };
      const handleMouseLeave = () => {
        map.getCanvas().style.cursor = '';
      };

      map.on('mouseenter', 'equipment-unclustered', handleMouseEnter);
      map.on('mouseleave', 'equipment-unclustered', handleMouseLeave);
      map.on('mouseenter', 'equipment-valves-circle', handleMouseEnter);
      map.on('mouseleave', 'equipment-valves-circle', handleMouseLeave);
      map.on('mouseenter', 'equipment-valves-icon', handleMouseEnter);
      map.on('mouseleave', 'equipment-valves-icon', handleMouseLeave);
    });
    }, 100);

    return () => {
      clearTimeout(initTimer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        onMapReady(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initialize only once on mount

  // Update map data when featureCollection changes
  useEffect(() => {
    console.log('[EquipmentMapView] Data update effect - mapReady:', mapReady, 'features:', featureCollection.features.length);
    if (!mapReady || !mapRef.current) {
      console.log('[EquipmentMapView] Skipping data update - map not ready');
      return;
    }
    const source = mapRef.current.getSource('equipment') as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      console.log('[EquipmentMapView] Updating source data with', featureCollection.features.length, 'features');
      source.setData(featureCollection as GeoJSON.FeatureCollection);
    } else {
      console.warn('[EquipmentMapView] Source not found for data update');
    }
  }, [featureCollection, mapReady]);

  // Resize map on container changes
  useEffect(() => {
    if (!mapRef.current || !containerRef.current) return;

    const timer = setTimeout(() => {
      mapRef.current?.resize();
    }, 50);

    const observer = new ResizeObserver(() => mapRef.current?.resize());
    observer.observe(containerRef.current);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [mapReady]);

  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
      <div ref={containerRef} className="absolute inset-0 z-0" style={{ width: '100%', height: '100%' }} />

      {/* Loading State */}
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-4 py-2 text-sm text-gray-600 shadow-sm backdrop-blur">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading equipment…
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="pointer-events-auto rounded-full border border-red-200 bg-white/90 px-4 py-2 text-sm text-red-600 shadow-sm backdrop-blur">
            Failed to load equipment
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && equipmentWithCoordsCount === 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="pointer-events-auto rounded-full border border-gray-200 bg-white/90 px-4 py-2 text-sm text-gray-600 shadow-sm backdrop-blur">
            No equipment with coordinates available
          </div>
        </div>
      )}

      {/* Gas Legend */}
      {!isLoading && equipmentWithCoordsCount > 0 && <MapGasLegend />}
    </div>
  );
}
