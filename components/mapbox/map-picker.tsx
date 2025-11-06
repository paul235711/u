'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  centerLat?: number;
  centerLng?: number;
}

export function MapPicker({
  onLocationSelect,
  initialLat,
  initialLng,
  centerLat = 0,
  centerLng = 0,
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

  useEffect(() => {
    callbackRef.current = onLocationSelect;
  }, [onLocationSelect]);

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

  return (
    <div className="relative">
      <div
        ref={mapContainer}
        className="w-full h-64 rounded-md border border-gray-300"
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md">
          <div className="text-gray-500">Loading map...</div>
        </div>
      )}
      <div className="mt-2 text-sm text-gray-600">
        Click on the map to select building location
      </div>
    </div>
  );
}
