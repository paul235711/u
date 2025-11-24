'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl, { MapboxGeoJSONFeature } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2, Crosshair } from 'lucide-react';
import { MapGasLegend } from './MapGasLegend';
import { GAS_LINE_COLORS } from '../hierarchy/gas-config';
import { EquipmentFloorControl } from './EquipmentFloorControl';

const STATUS_PALETTE: Record<string, { color: string; badge: string; muted: string }> = {
  open: { color: '#16a34a', badge: 'bg-emerald-100 text-emerald-700', muted: 'bg-emerald-50 text-emerald-400' },
  closed: { color: '#dc2626', badge: 'bg-rose-100 text-rose-700', muted: 'bg-rose-50 text-rose-400' },
  maintenance: { color: '#f59e0b', badge: 'bg-amber-100 text-amber-700', muted: 'bg-amber-50 text-amber-400' },
  alarm: { color: '#fb923c', badge: 'bg-orange-100 text-orange-700', muted: 'bg-orange-50 text-orange-400' },
  unknown: { color: '#6b7280', badge: 'bg-slate-100 text-slate-600', muted: 'bg-slate-50 text-slate-400' },
};

const DEFAULT_ZOOM = 13;

const GAS_COLORS: Record<string, string> = {
  oxygen: GAS_LINE_COLORS.oxygen,
  medical_air: GAS_LINE_COLORS.medical_air,
  vacuum: GAS_LINE_COLORS.vacuum,
  nitrogen: GAS_LINE_COLORS.nitrogen,
  nitrous_oxide: GAS_LINE_COLORS.nitrous_oxide,
  carbon_dioxide: GAS_LINE_COLORS.carbon_dioxide,
  co2: GAS_LINE_COLORS.co2,
  compressed_air: GAS_LINE_COLORS.compressed_air,
};

interface FloorSummary {
  id: string;
  name: string;
}

interface EquipmentMapViewProps {
  isLoading: boolean;
  isError: boolean;
  featureCollection: GeoJSON.FeatureCollection;
  equipmentWithCoordsCount: number;
  mapCenter: [number, number];
  onMapReady: (ready: boolean) => void;
  mapReady: boolean;
  focusedEquipmentId?: string | null;
  onFeatureClick?: (id: string) => void;
  selectedFloorId: string;
  floorsForSelectedBuilding: FloorSummary[];
  onFloorChange: (id: string) => void;
  selectedGasTypes: string[];
  onGasTypeToggle: (gasType: string) => void;
  availableGasTypes: string[];
  selectedTypes: string[];
  onTypeToggle: (type: 'source' | 'valve' | 'fitting') => void;
  hasSource: boolean;
  hasValve: boolean;
  hasFitting: boolean;
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
  focusedEquipmentId,
  onFeatureClick,
  selectedFloorId,
  floorsForSelectedBuilding,
  onFloorChange,
  selectedGasTypes,
  onGasTypeToggle,
  availableGasTypes,
  selectedTypes,
  onTypeToggle,
  hasSource,
  hasValve,
  hasFitting,
}: EquipmentMapViewProps) {
  console.log('[EquipmentMapView] Component rendering');
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const userLocationMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const [mapStyle, setMapStyle] = useState<'standard' | 'light' | 'satellite'>('standard');
  const [isLocating, setIsLocating] = useState(false);

  const styleUrl =
    mapStyle === 'standard'
      ? 'mapbox://styles/mapbox/standard'
      : mapStyle === 'light'
      ? 'mapbox://styles/mapbox/light-v11'
      : 'mapbox://styles/mapbox/satellite-streets-v12';

  const updateUserLocationMarker = (
    coords: [number, number],
    accuracyMeters: number
  ) => {
    if (!mapRef.current || typeof document === 'undefined') return;

    const [lng, lat] = coords;
    const zoom = mapRef.current.getZoom();
    const metersPerPixel =
      156543.03392 * Math.cos((lat * Math.PI) / 180) / Math.pow(2, zoom);

    const clampedAccuracy = Math.min(Math.max(accuracyMeters || 0, 10), 200);
    let radiusPx = clampedAccuracy / metersPerPixel;
    radiusPx = Math.max(12, Math.min(radiusPx, 160));
    const diameterPx = radiusPx * 2;

    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.setLngLat(coords);
      const el = userLocationMarkerRef.current.getElement() as HTMLDivElement | null;
      if (el) {
        el.style.width = `${diameterPx}px`;
        el.style.height = `${diameterPx}px`;
        const halo = el.querySelector('.user-location-halo') as HTMLDivElement | null;
        if (halo) {
          halo.style.width = `${diameterPx}px`;
          halo.style.height = `${diameterPx}px`;
        }
      }
      return;
    }

    const el = document.createElement('div');
    el.className = 'user-location-marker relative flex items-center justify-center';
    el.style.width = `${diameterPx}px`;
    el.style.height = `${diameterPx}px`;

    const halo = document.createElement('div');
    halo.className =
      'user-location-halo absolute rounded-full bg-blue-500/15 border border-blue-500/40 shadow-sm';
    halo.style.width = `${diameterPx}px`;
    halo.style.height = `${diameterPx}px`;

    const dot = document.createElement('div');
    dot.className = 'relative h-3 w-3 rounded-full bg-blue-600 border-2 border-white shadow';

    el.appendChild(halo);
    el.appendChild(dot);

    userLocationMarkerRef.current = new mapboxgl.Marker({
      element: el,
      anchor: 'center',
    })
      .setLngLat(coords)
      .addTo(mapRef.current);
  };

  const handleLocateMe = () => {
    if (!mapRef.current) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      console.warn('[EquipmentMapView] Geolocation not available in this browser');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        const accuracy = position.coords.accuracy ?? 0;
        const coords: [number, number] = [longitude, latitude];

        updateUserLocationMarker(coords, accuracy);

        if (mapRef.current) {
          mapRef.current.easeTo({
            center: coords,
            zoom: 17,
          });
        }
      },
      (error) => {
        console.warn('[EquipmentMapView] Geolocation error:', error);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

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
        style: styleUrl,
        center: mapCenter,
        zoom: DEFAULT_ZOOM,
      });
      
      console.log('[EquipmentMapView] Map instance created');

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    map.on('load', () => {
      console.log('[EquipmentMapView] Map loaded successfully');
      console.log('[EquipmentMapView] Map container size:', containerRef.current?.offsetWidth, 'x', containerRef.current?.offsetHeight);

      // Hide non-street labels from the base style (keep only street names)
      try {
        const style = map.getStyle();
        const layers = (style && (style as any).layers) as Array<any> | undefined;
        if (layers) {
          layers.forEach((layer) => {
            if (layer.type !== 'symbol') return;
            const id: string = layer.id ?? '';
            const sourceLayer: string | undefined = layer['source-layer'];

            const lowerId = id.toLowerCase();
            const isStreetLabel =
              (sourceLayer && sourceLayer.includes('road-label')) ||
              lowerId.includes('road-label') ||
              lowerId.includes('street-label');

            if (!isStreetLabel) {
              map.setLayoutProperty(id, 'visibility', 'none');
            }
          });
        }
      } catch (error) {
        console.warn('[EquipmentMapView] Failed to filter base labels:', error);
      }
      
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

      // Auto-fit map to all equipment points on initial load
      try {
        if (featureCollection.features.length > 0) {
          const bounds = new mapboxgl.LngLatBounds();
          featureCollection.features.forEach((feature: any) => {
            if (feature.geometry?.type === 'Point') {
              const coords = toLngLatTuple(feature.geometry.coordinates);
              if (coords) {
                bounds.extend(coords);
              }
            }
          });

          if (!bounds.isEmpty()) {
            map.fitBounds(bounds, {
              padding: 80,
              maxZoom: 18,
            });
          }
        }
      } catch (error) {
        console.warn('[EquipmentMapView] Failed to auto-fit bounds:', error);
      }

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
          'circle-opacity': [
            'case',
            ['==', ['get', 'highlightType'], 'selected'],
            1.0,
            ['==', ['get', 'highlightType'], 'downstream'],
            0.9,
            ['==', ['get', 'highlightType'], 'default'],
            0.85,
            0.25,
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });

      map.addLayer({
        id: 'equipment-valves-halo',
        type: 'circle',
        source: 'equipment',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'nodeType'], 'valve']],
        paint: {
          'circle-radius': 16,
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
          'circle-opacity': 0.18,
          'circle-blur': 0.6,
        },
      });

      map.addLayer({
        id: 'equipment-valves-circle',
        type: 'circle',
        source: 'equipment',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'nodeType'], 'valve']],
        paint: {
          'circle-radius': 12,
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
          'circle-opacity': [
            'case',
            ['==', ['get', 'highlightType'], 'selected'],
            1.0,
            ['==', ['get', 'highlightType'], 'downstream'],
            0.95,
            ['==', ['get', 'highlightType'], 'default'],
            0.9,
            0.3,
          ],
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

      const attachPopupCloseHandler = () => {
        if (!popupRef.current) return;
        const el = popupRef.current.getElement();
        if (!(el instanceof HTMLElement)) return;
        const content = el.querySelector('.mapboxgl-popup-content') as HTMLDivElement | null;
        if (content) {
          content.style.background = 'transparent';
          content.style.boxShadow = 'none';
          content.style.borderRadius = '0';
          content.style.border = 'none';
          content.style.padding = '0';
        }
        const closeBtn = el.querySelector('.synoptic-popup-close') as HTMLButtonElement | null;
        if (!closeBtn) return;
        closeBtn.onclick = (e) => {
          e.stopPropagation();
          popupRef.current?.remove();
        };
      };

      const buildPopupHtml = (
        props: Record<string, any>,
        imageUrl?: string,
        options?: { loadingMedia?: boolean }
      ): string => {
        const loadingMedia = options?.loadingMedia ?? false;
        const name = props.name ?? 'Equipment';
        const gasType = props.gasType ?? 'unknown';
        const nodeType = humanise(props.nodeType ?? 'equipment');
        const buildingLabel = props.buildingName
          ? `${props.buildingName}${props.floorName ? ` · ${props.floorName}` : ''}`
          : '';
        const gasKey = String(gasType);
        const gasColor = GAS_COLORS[gasKey] ?? GAS_COLORS['carbon_dioxide'];
        const gasLabel = humanise(String(gasKey));

        const badgeStyle = gasColor
          ? `style="border-color:${gasColor};"`
          : '';

        const badgeInner = props.nodeType === 'valve'
          ? `<img src="/valve.svg" alt="Valve" class="h-3.5 w-3.5" />`
          : `<span class="text-[11px] font-semibold">${(props.nodeType ?? '?')[0]?.toUpperCase?.() ?? 'N'}</span>`;

        const gasPillStyle = gasColor
          ? `style="color:${gasColor};border-color:${gasColor};"`
          : '';

        return `
          <div class="synoptic-popup relative min-w-[260px] max-w-sm rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
            <button type="button" class="synoptic-popup-close absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700">
              ✕
            </button>

            <div class="flex items-start gap-3 px-4 pt-4 pb-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-xl border bg-white text-xs font-semibold" ${badgeStyle}>
                ${badgeInner}
              </div>
              <div class="flex-1 space-y-0.5">
                <div class="text-sm font-semibold text-gray-900">${nodeType} • ${name}</div>
                <div class="text-[11px] font-medium text-gray-500">${gasLabel}</div>
              </div>
            </div>

            ${imageUrl
              ? `
                  <div class="relative h-32 w-full border-y border-gray-100 bg-gray-50">
                    <img
                      src="${imageUrl}"
                      alt="${name}"
                      class="h-full w-full object-cover"
                      onerror="this.style.display='none'"
                    />
                  </div>
                `
              : ''}

            <div class="px-4 py-3 space-y-2 border-t border-gray-100">
              ${buildingLabel
                ? `<div class="flex items-center gap-2 text-sm font-medium text-gray-800">
                     <span class="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-[12px]">🏢</span>
                     <span>${buildingLabel}</span>
                   </div>`
                : ''}

              <div class="flex items-center justify-between">
                <span class="inline-flex items-center rounded-full border bg-white px-2.5 py-0.5 text-[11px] font-semibold" ${gasPillStyle}>
                  ${gasLabel}
                </span>

                ${loadingMedia
                  ? `<div class="flex items-center gap-2 text-[11px] text-gray-400 italic">
                       <span class="inline-flex h-3 w-3 animate-pulse rounded-full bg-gray-300"></span>
                       <span>Loading photo...</span>
                     </div>`
                  : ''}
              </div>
            </div>
          </div>
        `;
      };

      const handleEquipmentClick = async (event: any) => {
        const selectedFeature = event.features?.[0] as MapboxGeoJSONFeature | undefined;
        if (!selectedFeature || selectedFeature.geometry.type !== 'Point') {
          return;
        }
        const coords = toLngLatTuple(selectedFeature.geometry.coordinates);
        if (!coords) return;
        const props = selectedFeature.properties as Record<string, string>;

        if (onFeatureClick && props.id) {
          onFeatureClick(String(props.id));
        }

        // Initial popup with loading state
        let html = buildPopupHtml(props, undefined, { loadingMedia: true });

        if (!popupRef.current) {
          popupRef.current = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: true,
            maxWidth: '340px',
          });
        }
        popupRef.current.setLngLat(coords).setHTML(html).addTo(map);
        attachPopupCloseHandler();

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
                html = buildPopupHtml(props, firstImage.fileUrl);
                popupRef.current.setHTML(html);
                attachPopupCloseHandler();
              } else {
                console.log('[EquipmentMapView] No image found in media');
                // No photo, show simplified version
                html = buildPopupHtml(props);
                popupRef.current.setHTML(html);
                attachPopupCloseHandler();
              }
            } else {
              // API error, show simplified version
              console.warn('[EquipmentMapView] Media API error:', mediaResponse.status);
              html = buildPopupHtml(props);
              popupRef.current.setHTML(html);
              attachPopupCloseHandler();
            }
          } catch (error) {
            console.error('[EquipmentMapView] Failed to load equipment photo:', error);
            // Show simplified version on error
            html = buildPopupHtml(props);
            popupRef.current.setHTML(html);
            attachPopupCloseHandler();
          }
        } else {
          // No elementId or nodeType, show basic info
          console.log('[EquipmentMapView] No elementId or nodeType, showing basic info');
          html = buildPopupHtml(props);
          popupRef.current.setHTML(html);
          attachPopupCloseHandler();
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
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
        userLocationMarkerRef.current = null;
      }
    };
  }, [mapStyle]);

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

  // Focus and dimming when a specific equipment item is selected
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const map = mapRef.current;

    if (!focusedEquipmentId) {
      return;
    }

    try {
      const features = map.querySourceFeatures('equipment', {
        filter: ['all', ['==', ['get', 'id'], focusedEquipmentId]],
      });

      if (features.length > 0) {
        const feature = features[0];
        if (feature.geometry.type === 'Point') {
          const coords = toLngLatTuple(feature.geometry.coordinates);
          if (coords) {
            map.easeTo({
              center: coords,
              zoom: 18,
              pitch: 25,
              bearing: 5,
              duration: 1000,
            });
          }
        }
      }
    } catch (error) {
      console.warn('[EquipmentMapView] Failed to apply focus styling:', error);
    }
  }, [focusedEquipmentId, mapReady]);

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

      {/* Map style toggle */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-1 rounded-full border border-gray-200 bg-white/90 px-1 py-1 text-xs shadow-sm backdrop-blur">
        <button
          type="button"
          onClick={() => setMapStyle('standard')}
          className={`rounded-full px-2 py-1 font-medium ${
            mapStyle === 'standard'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Std
        </button>
        <button
          type="button"
          onClick={() => setMapStyle('light')}
          className={`rounded-full px-2 py-1 font-medium ${
            mapStyle === 'light'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Plan
        </button>
        <button
          type="button"
          onClick={() => setMapStyle('satellite')}
          className={`rounded-full px-2 py-1 font-medium ${
            mapStyle === 'satellite'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Sat
        </button>
      </div>

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

      {/* Floor selector + locate-me (bottom-right) */}
      {!isLoading && !isError && equipmentWithCoordsCount > 0 && (
        <div className="pointer-events-none absolute bottom-4 right-4 z-20 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleLocateMe}
            className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-white/95 text-gray-800 shadow-sm backdrop-blur hover:bg-gray-100"
            aria-label="Center map on my location"
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Crosshair className="h-4 w-4" />
            )}
          </button>
          <div className="pointer-events-auto">
            <EquipmentFloorControl
              floors={floorsForSelectedBuilding}
              selectedFloorId={selectedFloorId}
              onFloorChange={onFloorChange}
            />
          </div>
        </div>
      )}

      {/* Gas Legend */}
      {!isLoading && equipmentWithCoordsCount > 0 && (
        <MapGasLegend
          selectedGasTypes={selectedGasTypes}
          onGasTypeToggle={onGasTypeToggle}
          availableGasTypes={availableGasTypes}
          selectedTypes={selectedTypes}
          onTypeToggle={onTypeToggle}
          hasSource={hasSource}
          hasValve={hasValve}
          hasFitting={hasFitting}
        />
      )}
    </div>
  );
}
