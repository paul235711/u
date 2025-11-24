"use client";

import { useState } from "react";
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
  siteId: string;
  buildingId?: string | null;
  floorId?: string | null;
  nodeId?: string | null;
  gasType?: string | null;
}

export function StepGeo({ value, onChange, siteLatitude, siteLongitude, siteId, buildingId, floorId, nodeId, gasType }: StepGeoProps) {
  const [scope, setScope] = useState<"site" | "floor">(buildingId || floorId ? "floor" : "site");
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

  const pickerBuildingId = scope === "site" ? undefined : buildingId;
  const pickerFloorId = scope === "site" ? undefined : floorId;

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

        <div className="mt-2 flex justify-end">
          <div className="inline-flex items-center gap-0.5 rounded-full border border-gray-200 bg-white/90 px-0.5 text-[11px] text-gray-700 shadow-sm">
            <button
              type="button"
              onClick={() => setScope("site")}
              className={`rounded-full px-2 py-1 ${
                scope === "site" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Site
            </button>
            <button
              type="button"
              onClick={() => setScope("floor")}
              className={`rounded-full px-2 py-1 ${
                scope === "floor" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
              disabled={!buildingId || !floorId}
            >
              Étage
            </button>
          </div>
        </div>

        <div className="rounded-md border border-gray-100 h-[300px]">
          <MapPicker
            onLocationSelect={handleLocationSelect}
            initialLat={latitude ?? undefined}
            initialLng={longitude ?? undefined}
            centerLat={centerLat}
            centerLng={centerLng}
            siteId={siteId}
            buildingId={pickerBuildingId}
            floorId={pickerFloorId}
            excludeNodeId={nodeId ?? undefined}
            gasType={gasType}
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
