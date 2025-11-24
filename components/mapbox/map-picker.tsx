"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Loader2, Crosshair } from "lucide-react";
import { GAS_LINE_COLORS } from "../synoptics/components/v2/hierarchy/gas-config";

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  centerLat?: number;
  centerLng?: number;
  siteId?: string;
  buildingId?: string | null;
  floorId?: string | null;
  highlightNodeId?: string;
  gasType?: string | null;
}

export function MapPicker({
  onLocationSelect,
  initialLat,
  initialLng,
  centerLat = 0,
  centerLng = 0,
  siteId,
  buildingId,
  floorId,
  highlightNodeId,
  gasType,
}: MapPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const callbackRef = useRef(onLocationSelect);
  const initialCenter = useRef<[number, number]>([
    centerLng ?? 0,
    centerLat ?? 0,
  ]);
  const previousCenter = useRef<[number, number] | null>(null);
  const equipmentNodesRef = useRef<any[] | null>(null);
  const [isLocating, setIsLocating] = useState(false);

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

  useEffect(() => {
    callbackRef.current = onLocationSelect;
  }, [onLocationSelect]);

  const toNumber = (value: unknown): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value === "string") {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const normalizeGasType = (value: unknown): string | null => {
    if (!value) return null;
    if (typeof value === "string") return value.toLowerCase();
    return null;
  };

  const targetGasType = normalizeGasType(gasType ?? null);

  const highlightId = highlightNodeId ? String(highlightNodeId) : null;

  const buildEquipmentFeatureCollection = () => {
    const nodes = equipmentNodesRef.current ?? [];
    const features: any[] = [];

    for (const node of nodes) {
      const lat =
        toNumber((node as any).latitude) ??
        toNumber((node as any).metadata?.latitude) ??
        toNumber((node as any).location?.latitude);
      const lng =
        toNumber((node as any).longitude) ??
        toNumber((node as any).metadata?.longitude) ??
        toNumber((node as any).location?.longitude);

      if (lat == null || lng == null) continue;

      const nodeBuildingId = (node as any).buildingId ?? (node as any).location?.buildingId ?? null;
      const nodeFloorId = (node as any).floorId ?? (node as any).location?.floorId ?? null;
      const nodeGasType = normalizeGasType((node as any).gasType ?? (node as any).metadata?.gasType);
      const nodeType = ((node as any).nodeType ?? "").toLowerCase();
      const isHighlight = highlightId ? String((node as any).id) === highlightId : false;

      if (buildingId && nodeBuildingId !== buildingId) continue;
      if (floorId && nodeFloorId !== floorId) continue;
      const isActiveGas = targetGasType ? nodeGasType === targetGasType : true;

      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lng, lat] as [number, number],
        },
        properties: {
          id: String((node as any).id),
          nodeType,
          gasType: nodeGasType ?? "unknown",
          isActiveGas,
          isHighlight,
        },
      });
    }

    return {
      type: "FeatureCollection",
      features,
    };
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('Mapbox access token not found');
      return;
    }

    mapboxgl.accessToken = accessToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter.current,
      zoom: 15,
    });

    previousCenter.current = initialCenter.current;

    map.current.on('load', () => {
      setIsLoaded(true);
    });

    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;

      // Remove existing marker
      if (marker.current) {
        marker.current.remove();
      }

      // Add new marker
      marker.current = new mapboxgl.Marker()
        .setLngLat([lng, lat])
        .addTo(map.current!);

      callbackRef.current?.(lat, lng);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Load nearby equipment for this site once
  useEffect(() => {
    if (!siteId) return;

    let aborted = false;

    const loadEquipment = async () => {
      try {
        const response = await fetch(`/api/synoptics/nodes?siteId=${siteId}`);
        if (!response.ok) return;
        const data = await response.json();
        if (aborted) return;
        equipmentNodesRef.current = Array.isArray(data) ? data : [];

        if (map.current && isLoaded) {
          const collection = buildEquipmentFeatureCollection();
          const source = map.current.getSource("picker-equipment") as mapboxgl.GeoJSONSource | undefined;
          if (source) {
            source.setData(collection as any);
          } else {
            map.current.addSource("picker-equipment", {
              type: "geojson",
              data: collection as any,
            });
            const valveColorExpression: any = [
              "match",
              ["get", "gasType"],
              "oxygen",
              GAS_COLORS.oxygen,
              "medical_air",
              GAS_COLORS.medical_air,
              "vacuum",
              GAS_COLORS.vacuum,
              "nitrogen",
              GAS_COLORS.nitrogen,
              "nitrous_oxide",
              GAS_COLORS.nitrous_oxide,
              "carbon_dioxide",
              GAS_COLORS.carbon_dioxide,
              "co2",
              GAS_COLORS.co2,
              "compressed_air",
              GAS_COLORS.compressed_air,
              "#6b7280",
            ];

            map.current.addLayer({
              id: "picker-valves-halo",
              type: "circle",
              source: "picker-equipment",
              filter: ["==", ["get", "nodeType"], "valve"],
              paint: {
                "circle-radius": 14,
                "circle-color": valveColorExpression,
                "circle-opacity": targetGasType
                  ? [
                      "case",
                      ["==", ["get", "gasType"], targetGasType],
                      0.18,
                      0.06,
                    ]
                  : 0.18,
                "circle-blur": 0.6,
              },
            });

            map.current.addLayer({
              id: "picker-valves-circle",
              type: "circle",
              source: "picker-equipment",
              filter: ["==", ["get", "nodeType"], "valve"],
              paint: {
                "circle-radius": 11,
                "circle-color": valveColorExpression,
                "circle-opacity": targetGasType
                  ? [
                      "case",
                      ["==", ["get", "gasType"], targetGasType],
                      0.95,
                      0.3,
                    ]
                  : 0.95,
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": 2,
              },
            });

            const valveImage = new Image(40, 40);
            valveImage.onload = () => {
              if (map.current && !map.current.hasImage("picker-valve-icon")) {
                map.current.addImage("picker-valve-icon", valveImage, { pixelRatio: 2 });
              }

              map.current?.addLayer({
                id: "picker-valves-icon",
                type: "symbol",
                source: "picker-equipment",
                filter: ["==", ["get", "nodeType"], "valve"],
                layout: {
                  "icon-image": "picker-valve-icon",
                  "icon-size": 0.35,
                  "icon-allow-overlap": true,
                },
              });
            };
            valveImage.src = "/valve.svg";

            const sourceColorExpression = valveColorExpression;

            map.current.addLayer({
              id: "picker-sources-halo",
              type: "circle",
              source: "picker-equipment",
              filter: ["==", ["get", "nodeType"], "source"],
              paint: {
                "circle-radius": 13,
                "circle-color": sourceColorExpression,
                "circle-opacity": targetGasType
                  ? [
                      "case",
                      ["==", ["get", "gasType"], targetGasType],
                      0.15,
                      0.05,
                    ]
                  : 0.15,
                "circle-blur": 0.5,
              },
            });

            map.current.addLayer({
              id: "picker-sources-ring",
              type: "circle",
              source: "picker-equipment",
              filter: ["==", ["get", "nodeType"], "source"],
              paint: {
                "circle-radius": 11,
                "circle-color": "rgba(0,0,0,0)",
                "circle-stroke-color": sourceColorExpression,
                "circle-stroke-width": 3,
                "circle-stroke-opacity": targetGasType
                  ? [
                      "case",
                      ["==", ["get", "gasType"], targetGasType],
                      1,
                      0.3,
                    ]
                  : 1,
              },
            });

            map.current.addLayer({
              id: "picker-sources-symbol",
              type: "symbol",
              source: "picker-equipment",
              filter: ["==", ["get", "nodeType"], "source"],
              layout: {
                "text-field": "S",
                "text-size": 14,
                "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                "text-allow-overlap": true,
              },
              paint: {
                "text-color": "#111827",
              },
            });

            map.current.addLayer({
              id: "picker-equipment-other",
              type: "circle",
              source: "picker-equipment",
              filter: ["all", ["!=", ["get", "nodeType"], "valve"], ["!=", ["get", "nodeType"], "source"]],
              paint: {
                "circle-radius": 6,
                "circle-color": "#0f766e",
                "circle-opacity": targetGasType
                  ? [
                      "case",
                      ["get", "isActiveGas"],
                      0.7,
                      0.25,
                    ]
                  : 0.7,
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": 1.5,
              },
            });

            map.current.addLayer({
              id: "picker-current-equipment",
              type: "circle",
              source: "picker-equipment",
              filter: ["==", ["get", "isHighlight"], true],
              paint: {
                "circle-radius": 16,
                "circle-color": "rgba(249,115,22,0.15)",
                "circle-stroke-color": "#f97316",
                "circle-stroke-width": 3,
              },
            });
          }
        }
      } catch (error) {
        console.error("Failed to load equipment for map picker", error);
      }
    };

    loadEquipment();

    return () => {
      aborted = true;
    };
  }, [siteId, isLoaded]);

  // Update equipment layer when building/floor context changes
  useEffect(() => {
    if (!map.current || !isLoaded || !equipmentNodesRef.current) return;

    const source = map.current.getSource("picker-equipment") as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;

    const collection = buildEquipmentFeatureCollection();
    source.setData(collection as any);
  }, [buildingId, floorId, highlightId, targetGasType, isLoaded]);

  useEffect(() => {
    if (!map.current || !isLoaded) return;
    if (centerLat === undefined || centerLng === undefined) return;

    const nextCenter: [number, number] = [centerLng, centerLat];
    const [prevLng = NaN, prevLat = NaN] = previousCenter.current ?? [];
    if (prevLng === nextCenter[0] && prevLat === nextCenter[1]) {
      return;
    }

    previousCenter.current = nextCenter;
    map.current.easeTo({ center: nextCenter, duration: 400 });
  }, [centerLat, centerLng, isLoaded]);

  // Handle initial marker placement and updates
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    // Remove existing marker
    if (marker.current) {
      marker.current.remove();
      marker.current = null;
    }

    // Add marker if coordinates provided
    if (initialLat !== undefined && initialLng !== undefined) {
      marker.current = new mapboxgl.Marker()
        .setLngLat([initialLng, initialLat])
        .addTo(map.current);
    }
  }, [initialLat, initialLng, isLoaded]);

  const handleLocateMe = () => {
    if (!map.current) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      console.warn("[MapPicker] Geolocation not available in this browser");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;

        if (map.current) {
          map.current.easeTo({ center: [longitude, latitude], zoom: 17 });
        }

        // Update marker and propagate selection
        if (marker.current) {
          marker.current.setLngLat([longitude, latitude]);
        } else if (map.current) {
          marker.current = new mapboxgl.Marker()
            .setLngLat([longitude, latitude])
            .addTo(map.current);
        }

        callbackRef.current?.(latitude, longitude);
      },
      (error) => {
        console.warn("[MapPicker] Geolocation error", error);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  return (
    <div className="relative">
      <div
        ref={mapContainer}
        className="w-full h-64 rounded-md border border-gray-300"
      />

      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-gray-100/90">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-4 py-2 text-sm text-gray-600 shadow-sm backdrop-blur">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading map…</span>
          </div>
        </div>
      )}

      {/* Locate-me control */}
      {isLoaded && (
        <div className="pointer-events-none absolute bottom-3 right-3 z-10 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleLocateMe}
            className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-gray-200 bg-white/95 text-gray-800 shadow-sm backdrop-blur hover:bg-gray-100"
            aria-label="Center map on my location"
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Crosshair className="h-4 w-4" />
            )}
          </button>
        </div>
      )}

      <div className="mt-2 text-sm text-gray-600">
        Click on the map to select building location
      </div>
    </div>
  );
}
