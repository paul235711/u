"use client";

import { MapPicker } from "@/components/mapbox/map-picker";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { EquipmentWizardGeo } from "./EquipmentWizardDialog";

export interface StepGeoProps {
  value: EquipmentWizardGeo;
  onChange: (next: EquipmentWizardGeo) => void;
  siteLatitude?: number;
  siteLongitude?: number;
}

export function StepGeo({ value, onChange, siteLatitude, siteLongitude }: StepGeoProps) {
  const handleLocationSelect = (lat: number, lng: number) => {
    onChange({ ...value, latitude: lat, longitude: lng });
  };

  const handleReset = () => {
    onChange({ ...value, latitude: undefined, longitude: undefined });
  };

  const latitude = value.latitude ?? null;
  const longitude = value.longitude ?? null;

  const centerLat = latitude ?? siteLatitude;
  const centerLng = longitude ?? siteLongitude;

  const latitudeDisplay = latitude !== null ? latitude.toFixed(6) : "";
  const longitudeDisplay = longitude !== null ? longitude.toFixed(6) : "";

  return (
    <div className="space-y-3">
      <div className="space-y-3 rounded-md border border-gray-200 p-4">
        <div className="space-y-1">
          <Label>Géolocalisation (optionnel)</Label>
          <p className="text-xs text-gray-500">
            Cliquez sur la carte pour définir la position de l'équipement sur le site.
          </p>
        </div>

        <div className="rounded-md border border-gray-100 h-[300px]">
          <MapPicker
            onLocationSelect={handleLocationSelect}
            initialLat={latitude ?? undefined}
            initialLng={longitude ?? undefined}
            centerLat={centerLat}
            centerLng={centerLng}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-3">
          <div>
            <Label htmlFor="wizard-latitude">Latitude</Label>
            <Input
              id="wizard-latitude"
              value={latitudeDisplay}
              readOnly
              className="mt-1 bg-gray-50 text-gray-700"
            />
          </div>
          <div>
            <Label htmlFor="wizard-longitude">Longitude</Label>
            <Input
              id="wizard-longitude"
              value={longitudeDisplay}
              readOnly
              className="mt-1 bg-gray-50 text-gray-700"
            />
          </div>
        </div>

        <div className="mt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={latitude === null && longitude === null}
          >
            Effacer la position
          </Button>
        </div>
      </div>
    </div>
  );
}
