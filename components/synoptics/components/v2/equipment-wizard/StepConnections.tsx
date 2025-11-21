"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { EquipmentLocationBreadcrumb } from "../EquipmentLocationBreadcrumb";
import {
  useEquipmentList,
  useEquipmentDetails,
} from "../equipment-bank/hooks/useEquipmentQueries";
import type { EquipmentWizardConnectionsState } from "./EquipmentWizardDialog";

export interface StepConnectionsProps {
  value: EquipmentWizardConnectionsState;
  onChange: (next: EquipmentWizardConnectionsState) => void;
  siteId: string;
  gasType?: string | null;
}

export function StepConnections({ value, onChange, siteId, gasType }: StepConnectionsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [buildingFilter, setBuildingFilter] = useState<string | "all">("all");
  const [floorFilter, setFloorFilter] = useState<string | "all">("all");

  const { data: allNodes = [], isLoading } = useEquipmentList(siteId);
  const { data: details = {} } = useEquipmentDetails(allNodes, {
    enabled: allNodes.length > 0,
  });

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

  const upstreamIds = value.upstreamTargetNodeIds ?? [];
  const downstreamIds = value.downstreamTargetNodeIds ?? [];
  const selectedIds = value.targetNodeIds ?? [];

  const nodeMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const node of allNodes as any[]) {
      map.set(node.id, node);
    }
    return map;
  }, [allNodes]);

  const toggleUpstream = (nodeId: string) => {
    const inUpstream = upstreamIds.includes(nodeId);
    const nextUpstream = inUpstream
      ? upstreamIds.filter((id) => id !== nodeId)
      : [...upstreamIds, nodeId];
    const allTargets = Array.from(new Set<string>([...nextUpstream, ...downstreamIds]));
    onChange({
      ...value,
      upstreamTargetNodeIds: nextUpstream,
      downstreamTargetNodeIds: downstreamIds,
      targetNodeIds: allTargets,
    });
  };

  const toggleDownstream = (nodeId: string) => {
    const inDownstream = downstreamIds.includes(nodeId);
    const nextDownstream = inDownstream
      ? downstreamIds.filter((id) => id !== nodeId)
      : [...downstreamIds, nodeId];
    const allTargets = Array.from(new Set<string>([...upstreamIds, ...nextDownstream]));
    onChange({
      ...value,
      upstreamTargetNodeIds: upstreamIds,
      downstreamTargetNodeIds: nextDownstream,
      targetNodeIds: allTargets,
    });
  };

  const filteredNodes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return allNodes.filter((node) => {
      const detail = (details as any)[node.id];
      const nodeGas: string | undefined = detail?.gasType;

      // Filtre localisation : bâtiment / étage à partir des IDs présents sur le nœud
      if (buildingFilter !== "all" && node.buildingId !== buildingFilter) {
        return false;
      }

      if (floorFilter !== "all" && node.floorId !== floorFilter) {
        return false;
      }

      // Filtre par gaz : si un gaz est défini pour l'équipement, on ne conserve
      // que les nœuds qui ont un gaz défini et strictement égal à ce gaz.
      if (gasType) {
        if (!nodeGas) return false;
        if (nodeGas !== gasType) return false;
      }

      if (!term) return true;

      const nodeTypeMatch = node.nodeType?.toLowerCase().includes(term);
      const nodeIdMatch = node.id?.toLowerCase().includes(term);
      const nameMatch = detail?.name?.toLowerCase().includes(term);
      const gasMatch = nodeGas?.toLowerCase().includes(term);

      return nodeTypeMatch || nodeIdMatch || nameMatch || gasMatch;
    });
  }, [allNodes, details, searchTerm, gasType, buildingFilter, floorFilter]);

  const availableBuildings: { id: string; name: string }[] = useMemo(() => {
    const set = new Set<string>();
    for (const node of allNodes as any[]) {
      if (node.buildingId) set.add(node.buildingId);
    }

    const buildingsFromHierarchy: { id: string; name: string }[] =
      hierarchyData?.buildings?.map((b: any) => ({ id: b.id, name: b.name })) ?? [];

    const result: { id: string; name: string }[] = [];
    for (const b of buildingsFromHierarchy) {
      if (set.has(b.id)) result.push(b);
    }

    // Si certaines buildingId n'apparaissent pas dans la hiérarchie (cas rare), on les ajoute en brut
    for (const id of set) {
      if (!result.some((b) => b.id === id)) {
        result.push({ id, name: id });
      }
    }

    return result;
  }, [allNodes, hierarchyData]);

  const availableFloors: { id: string; name: string }[] = useMemo(() => {
    if (!hierarchyData) return [];

    const floors: { id: string; name: string }[] = [];

    hierarchyData.buildings?.forEach((b: any) => {
      if (buildingFilter !== "all" && b.id !== buildingFilter) return;
      b.floors?.forEach((f: any) => {
        floors.push({ id: f.id, name: f.name });
      });
    });

    return floors;
  }, [hierarchyData, buildingFilter]);

  return (
    <div className="space-y-3">
      {/* Résumé amont / aval (edit mode) */}
      {(upstreamIds.length > 0 || downstreamIds.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <div className="font-medium text-gray-700 mb-1">Nœud(s) amont</div>
            {upstreamIds.length === 0 ? (
              <p className="text-gray-400">Aucun nœud amont sélectionné.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {upstreamIds.map((id) => {
                  const node = nodeMap.get(id);
                  if (!node) return null;

                  const detail = (details as any)[id] ?? {};
                  const label = detail.name || node.name || id;
                  const typeLabel = node.nodeType;

                  return (
                    <div
                      key={id}
                      className="flex flex-col gap-0.5 rounded border px-2 py-1 bg-secondary/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate max-w-[160px]">{label}</span>
                        <span className="text-[10px] uppercase text-gray-500 shrink-0">
                          {typeLabel}
                        </span>
                      </div>
                      <EquipmentLocationBreadcrumb
                        node={node}
                        siteId={siteId}
                        variant="compact"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="font-medium text-gray-700 mb-1">Nœud(s) aval</div>
            {downstreamIds.length === 0 ? (
              <p className="text-gray-400">Aucun nœud aval sélectionné.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {downstreamIds.map((id) => {
                  const node = nodeMap.get(id);
                  if (!node) return null;

                  const detail = (details as any)[id] ?? {};
                  const label = detail.name || node.name || id;
                  const typeLabel = node.nodeType;

                  return (
                    <div
                      key={id}
                      className="flex flex-col gap-0.5 rounded border px-2 py-1 bg-secondary/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate max-w-[160px]">{label}</span>
                        <span className="text-[10px] uppercase text-gray-500 shrink-0">
                          {typeLabel}
                        </span>
                      </div>
                      <EquipmentLocationBreadcrumb
                        node={node}
                        siteId={siteId}
                        variant="compact"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-1">
        <Label>Connexions avec d'autres nœuds (optionnel)</Label>
        <p className="text-xs text-gray-500">
          Sélectionnez les nœuds auxquels cet équipement sera connecté. Ceci sera utilisé pour suggérer
          ou créer des connexions réseau.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1 space-y-1">
          <Label htmlFor="wizard-connections-search" className="text-xs">
            Rechercher un nœud (nom, type, gaz...)
          </Label>
          <Input
            id="wizard-connections-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Ex : Valve O2, Source principale..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:w-[360px]">
          <div className="space-y-1">
            <Label className="text-xs">Filtrer par bâtiment</Label>
            <Select
              value={buildingFilter}
              onValueChange={(val) => {
                setBuildingFilter(val as any);
                setFloorFilter("all");
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tous les bâtiments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les bâtiments</SelectItem>
                {availableBuildings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Filtrer par étage</Label>
            <Select
              value={floorFilter}
              onValueChange={(val) => setFloorFilter(val as any)}
              disabled={buildingFilter === "all"}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tous les étages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les étages</SelectItem>
                {availableFloors.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Sélection des nœuds amont</Label>
          <ScrollArea className="h-64 border rounded-md">
            <div className="p-2 space-y-1 text-sm">
              {isLoading && (
                <div className="text-gray-400 px-1 py-2">Chargement des nœuds…</div>
              )}
              {!isLoading && filteredNodes.length === 0 && (
                <div className="text-gray-400 px-1 py-2">Aucun nœud trouvé pour ce site.</div>
              )}

              {!isLoading &&
                filteredNodes.map((node: any) => {
                  const detail = (details as any)[node.id] ?? {};
                  const isSelected = upstreamIds.includes(node.id);
                  const label = detail.name || node.id;
                  const gas = detail.gasType;

                  return (
                    <div
                      key={node.id}
                      className="flex items-center justify-between gap-2 px-1 py-1 rounded-md hover:bg-gray-50"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{label}</span>
                        <div className="flex gap-2 items-center text-xs text-gray-500">
                          <span>{node.nodeType}</span>
                          {gas && <Badge variant="outline">{gas}</Badge>}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => toggleUpstream(node.id)}
                      >
                        {isSelected ? "Retirer" : "Ajouter"}
                      </Button>
                    </div>
                  );
                })}
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Sélection des nœuds aval</Label>
          <ScrollArea className="h-64 border rounded-md">
            <div className="p-2 space-y-1 text-sm">
              {isLoading && (
                <div className="text-gray-400 px-1 py-2">Chargement des nœuds…</div>
              )}
              {!isLoading && filteredNodes.length === 0 && (
                <div className="text-gray-400 px-1 py-2">Aucun nœud trouvé pour ce site.</div>
              )}

              {!isLoading &&
                filteredNodes.map((node: any) => {
                  const detail = (details as any)[node.id] ?? {};
                  const isSelected = downstreamIds.includes(node.id);
                  const label = detail.name || node.id;
                  const gas = detail.gasType;

                  return (
                    <div
                      key={node.id}
                      className="flex items-center justify-between gap-2 px-1 py-1 rounded-md hover:bg-gray-50"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{label}</span>
                        <div className="flex gap-2 items-center text-xs text-gray-500">
                          <span>{node.nodeType}</span>
                          {gas && <Badge variant="outline">{gas}</Badge>}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => toggleDownstream(node.id)}
                      >
                        {isSelected ? "Retirer" : "Ajouter"}
                      </Button>
                    </div>
                  );
                })}
            </div>
          </ScrollArea>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="text-xs text-gray-600">
          {selectedIds.length} nœud{selectedIds.length > 1 ? "s" : ""} sélectionné
          {selectedIds.length > 1 ? "s" : ""} pour connexion.
        </div>
      )}
    </div>
  );
}
