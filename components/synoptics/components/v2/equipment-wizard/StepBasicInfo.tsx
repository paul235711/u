"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GAS_TYPES } from "../../../shared/gas-type-selector";
import type { EquipmentWizardBasicInfo } from "./EquipmentWizardDialog";
import type { GasType } from "../hierarchy/gas-indicators";

export interface StepBasicInfoProps {
  value: EquipmentWizardBasicInfo;
  onChange: (next: EquipmentWizardBasicInfo) => void;
  siteId: string;
}

export function StepBasicInfo({ value, onChange, siteId }: StepBasicInfoProps) {
  // TODO: implémenter le formulaire (type, gaz, nom, bâtiment/étage/zone)

  const { data: hierarchyData } = useQuery({
    queryKey: ["site-hierarchy", siteId],
    queryFn: async () => {
      const response = await fetch(`/api/synoptics/sites/${siteId}/hierarchy`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!siteId,
    staleTime: 30000,
  });

  const buildings = useMemo(() => (hierarchyData as any)?.buildings ?? [], [hierarchyData]);
  const selectedBuilding = useMemo(
    () => buildings.find((b: any) => b.id === value.buildingId),
    [buildings, value.buildingId]
  );
  const floors = selectedBuilding?.floors ?? [];
  const selectedFloor = useMemo(
    () => floors.find((f: any) => f.id === value.floorId),
    [floors, value.floorId]
  );
  const zones = selectedFloor?.zones ?? [];

  const update = (patch: Partial<EquipmentWizardBasicInfo>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label htmlFor="equipment-type">Type *</Label>
          <Select
            value={value.type ?? undefined}
            onValueChange={(next) => update({ type: next as EquipmentWizardBasicInfo["type"] })}
          >
            <SelectTrigger id="equipment-type">
              <SelectValue placeholder="Sélectionner un type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="valve">Valve</SelectItem>
              <SelectItem value="source">Source</SelectItem>
              <SelectItem value="fitting">Fitting</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="wizard-gas">Gaz *</Label>
          <Select
            value={(value.gasType as GasType | null) ?? undefined}
            onValueChange={(next) => update({ gasType: next as GasType })}
          >
            <SelectTrigger id="wizard-gas">
              <SelectValue placeholder="Sélectionner un gaz" />
            </SelectTrigger>
            <SelectContent>
              {GAS_TYPES.map((gas) => (
                <SelectItem key={gas.value} value={gas.value}>
                  <span className="flex items-center gap-2">
                    <span className={`inline-block w-8 h-1 rounded ${gas.color}`} aria-hidden="true" />
                    <span>
                      {gas.label}
                      {gas.symbol && (
                        <span className="ml-1 text-xs text-gray-500">({gas.symbol})</span>
                      )}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="equipment-name">Nom</Label>
        <Input
          id="equipment-name"
          value={value.name}
          onChange={(event) => update({ name: event.target.value })}
          placeholder="Nom de l'équipement"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-gray-600">Positionnement (Bâtiment, Étage, Zone)</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="wizard-building" className="text-xs">
              Bâtiment
            </Label>
            <Select
              value={value.buildingId ?? "none"}
              onValueChange={(next) =>
                update({
                  buildingId: next === "none" ? null : next,
                  floorId: null,
                  zoneId: null,
                })
              }
              disabled={!hierarchyData}
            >
              <SelectTrigger
                id="wizard-building"
                className="mt-1 !h-auto min-h-9 items-start py-2 text-left whitespace-normal break-words"
              >
                <SelectValue
                  placeholder="Non défini"
                  className="whitespace-normal break-words line-clamp-2"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {buildings.map((building: any) => (
                  <SelectItem key={building.id} value={building.id}>
                    {building.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="wizard-floor" className="text-xs">
              Étage
            </Label>
            <Select
              value={value.floorId ?? "none"}
              onValueChange={(next) =>
                update({
                  floorId: next === "none" ? null : next,
                  zoneId: null,
                })
              }
              disabled={!value.buildingId || !hierarchyData}
            >
              <SelectTrigger
                id="wizard-floor"
                className="mt-1 !h-auto min-h-9 items-start py-2 text-left whitespace-normal break-words"
              >
                <SelectValue
                  placeholder={value.buildingId ? "Sélectionner" : "Choisir un bâtiment"}
                  className="whitespace-normal break-words line-clamp-2"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {floors.map((floor: any) => (
                  <SelectItem key={floor.id} value={floor.id}>
                    {floor.name || `Étage ${floor.floorNumber}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="wizard-zone" className="text-xs">
              Zone
            </Label>
            <Select
              value={value.zoneId ?? "none"}
              onValueChange={(next) => update({ zoneId: next === "none" ? null : next })}
              disabled={!value.floorId || !hierarchyData}
            >
              <SelectTrigger
                id="wizard-zone"
                className="mt-1 !h-auto min-h-9 items-start py-2 text-left whitespace-normal break-words"
              >
                <SelectValue
                  placeholder={value.floorId ? "Sélectionner" : "Choisir un étage"}
                  className="whitespace-normal break-words line-clamp-2"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune</SelectItem>
                {zones.map((zone: any) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
