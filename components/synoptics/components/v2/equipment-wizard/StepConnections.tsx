"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  useEquipmentList,
  useEquipmentDetails,
} from "../equipment-bank/hooks/useEquipmentQueries";
import type { EquipmentWizardConnectionsState } from "./EquipmentWizardDialog";

export interface StepConnectionsProps {
  value: EquipmentWizardConnectionsState;
  onChange: (next: EquipmentWizardConnectionsState) => void;
  siteId: string;
}

export function StepConnections({ value, onChange, siteId }: StepConnectionsProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: allNodes = [], isLoading } = useEquipmentList(siteId);
  const { data: details = {} } = useEquipmentDetails(allNodes, {
    enabled: allNodes.length > 0,
  });

  const selectedIds = value.targetNodeIds ?? [];

  const toggleNode = (nodeId: string) => {
    const exists = selectedIds.includes(nodeId);
    const nextSelected = exists
      ? selectedIds.filter((id) => id !== nodeId)
      : [...selectedIds, nodeId];
    onChange({ ...value, targetNodeIds: nextSelected });
  };

  const filteredNodes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return allNodes;

    return allNodes.filter((node) => {
      const nodeTypeMatch = node.nodeType?.toLowerCase().includes(term);
      const nodeIdMatch = node.id?.toLowerCase().includes(term);
      const detail = (details as any)[node.id];
      const nameMatch = detail?.name?.toLowerCase().includes(term);
      const gasMatch = detail?.gasType?.toLowerCase().includes(term);
      return nodeTypeMatch || nodeIdMatch || nameMatch || gasMatch;
    });
  }, [allNodes, details, searchTerm]);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Connexions avec d'autres nœuds (optionnel)</Label>
        <p className="text-xs text-gray-500">
          Sélectionnez les nœuds auxquels cet équipement sera connecté. Ceci sera utilisé pour suggérer
          ou créer des connexions réseau.
        </p>
      </div>

      <div className="space-y-2">
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

      <ScrollArea className="h-64 border rounded-md">
        <div className="p-2 space-y-1 text-sm">
          {isLoading && <div className="text-gray-400 px-1 py-2">Chargement des nœuds…</div>}
          {!isLoading && filteredNodes.length === 0 && (
            <div className="text-gray-400 px-1 py-2">Aucun nœud trouvé pour ce site.</div>
          )}

          {!isLoading &&
            filteredNodes.map((node: any) => {
              const detail = (details as any)[node.id] ?? {};
              const isSelected = selectedIds.includes(node.id);
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
                    onClick={() => toggleNode(node.id)}
                  >
                    {isSelected ? "Sélectionné" : "Sélectionner"}
                  </Button>
                </div>
              );
            })}
        </div>
      </ScrollArea>

      {selectedIds.length > 0 && (
        <div className="text-xs text-gray-600">
          {selectedIds.length} nœud{selectedIds.length > 1 ? "s" : ""} sélectionné
          {selectedIds.length > 1 ? "s" : ""} pour connexion.
        </div>
      )}
    </div>
  );
}
