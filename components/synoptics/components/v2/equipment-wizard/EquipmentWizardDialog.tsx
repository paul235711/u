"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StepBasicInfo } from "./StepBasicInfo";
import { StepMedia } from "./StepMedia";
import { StepGeo } from "./StepGeo";
import { StepConnections } from "./StepConnections";
import type { GasType } from "../hierarchy/gas-indicators";

export type EquipmentWizardMode = "create" | "edit";

export type EquipmentType = "valve" | "source" | "fitting";

export interface EquipmentWizardBasicInfo {
  type: EquipmentType | null;
  gasType: GasType | null;
  name: string;
  buildingId?: string | null;
  floorId?: string | null;
  zoneId?: string | null;
}

export interface EquipmentWizardGeo {
  latitude?: number | null;
  longitude?: number | null;
}

export interface EquipmentWizardMediaState {
  newFiles: File[];
}

export interface EquipmentWizardConnectionsState {
  targetNodeIds: string[];
  upstreamTargetNodeIds: string[];
  downstreamTargetNodeIds: string[];
}

export interface EquipmentWizardDialogProps {
  open: boolean;
  mode: EquipmentWizardMode;
  siteId: string;
  onOpenChange: (open: boolean) => void;
  siteLatitude?: number;
  siteLongitude?: number;
  node?: {
    id: string;
    nodeType: EquipmentType;
    elementId: string;
  };
  onCompleted?: (result: { nodeId: string; elementId: string }) => void;
}

export function EquipmentWizardDialog({ open, mode, siteId, onOpenChange, siteLatitude, siteLongitude, node, onCompleted }: EquipmentWizardDialogProps) {
  const [activeTab, setActiveTab] = useState("basic");

  // shared form state (will be expanded later)
  const [basicInfo, setBasicInfo] = useState<EquipmentWizardBasicInfo>({
    type: null,
    gasType: null,
    name: "",
    buildingId: null,
    floorId: null,
    zoneId: null,
  });

  const [mediaState, setMediaState] = useState<EquipmentWizardMediaState>({
    newFiles: [],
  });

  const [geoState, setGeoState] = useState<EquipmentWizardGeo>({});

  const [connectionsState, setConnectionsState] = useState<EquipmentWizardConnectionsState>({
    targetNodeIds: [],
    upstreamTargetNodeIds: [],
    downstreamTargetNodeIds: [],
  });

  const [initialConnectionTargets, setInitialConnectionTargets] = useState<string[]>([]);
  const [existingConnections, setExistingConnections] = useState<
    { id: string; fromNodeId: string; toNodeId: string }[]
  >([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isSubmitDisabled = isSubmitting || !basicInfo.type || !basicInfo.gasType;

  // Prefill state when opening in edit mode
  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && node) {
      setBasicInfo((prev) => ({
        ...prev,
        type: node.nodeType ?? prev.type,
        gasType: (node as any).gasType ?? prev.gasType,
        name: (node as any).name ?? "",
        buildingId: (node as any).buildingId ?? null,
        floorId: (node as any).floorId ?? null,
        zoneId: (node as any).zoneId ?? null,
      }));

      const rawLat = (node as any).latitude ?? (node as any).location?.latitude;
      const rawLng = (node as any).longitude ?? (node as any).location?.longitude;

      const toNumberOrNull = (value: unknown): number | null => {
        if (value === null || value === undefined) return null;
        if (typeof value === "number") return Number.isFinite(value) ? value : null;
        if (typeof value === "string") {
          const parsed = parseFloat(value);
          return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
      };

      const latNum = toNumberOrNull(rawLat);
      const lngNum = toNumberOrNull(rawLng);

      setGeoState({
        latitude: latNum,
        longitude: lngNum,
      });
    }

    if (mode === "create" && !node) {
      setBasicInfo({
        type: null,
        gasType: null,
        name: "",
        buildingId: null,
        floorId: null,
        zoneId: null,
      });
      setGeoState({});
      setConnectionsState({ targetNodeIds: [], upstreamTargetNodeIds: [], downstreamTargetNodeIds: [] });
      setInitialConnectionTargets([]);
      setExistingConnections([]);
    }
  }, [open, mode, node]);

  // Load existing connections for this node in edit mode
  useEffect(() => {
    if (!open || mode !== "edit" || !node) return;

    let aborted = false;

    const loadConnections = async () => {
      try {
        const response = await fetch(`/api/synoptics/connections?siteId=${siteId}`);
        if (!response.ok) return;
        const allConnections = (await response.json()) as {
          id: string;
          fromNodeId: string;
          toNodeId: string;
        }[];
        if (aborted) return;

        const forNode = allConnections.filter(
          (connection) =>
            connection.fromNodeId === node.id || connection.toNodeId === node.id
        );

        setExistingConnections(forNode);

        const upstream: string[] = [];
        const downstream: string[] = [];

        for (const connection of forNode) {
          if (connection.toNodeId === node.id) {
            upstream.push(connection.fromNodeId);
          } else if (connection.fromNodeId === node.id) {
            downstream.push(connection.toNodeId);
          }
        }

        const targets = Array.from(new Set<string>([...upstream, ...downstream]));

        setConnectionsState((prev) => ({
          ...prev,
          targetNodeIds: targets,
          upstreamTargetNodeIds: upstream,
          downstreamTargetNodeIds: downstream,
        }));
        setInitialConnectionTargets(targets);
      } catch (error) {
        console.error("Failed to load connections for node", error);
      }
    };

    loadConnections();

    return () => {
      aborted = true;
    };
  }, [open, mode, node, siteId]);

  const handleSubmit = async () => {
    if (!basicInfo.type || !basicInfo.gasType) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const equipmentType = basicInfo.type;
      const gasType = basicInfo.gasType;

      if (mode === "edit") {
        if (!node) {
          throw new Error("Aucun nœud fourni pour le mode édition.");
        }

        let elementEndpoint = "";
        if (node.nodeType === "valve") elementEndpoint = `/api/synoptics/valves/${node.elementId}`;
        else if (node.nodeType === "source") elementEndpoint = `/api/synoptics/sources/${node.elementId}`;
        else if (node.nodeType === "fitting") elementEndpoint = `/api/synoptics/fittings/${node.elementId}`;

        if (!elementEndpoint) {
          throw new Error("Type de nœud inconnu pour la mise à jour de l'équipement.");
        }

        const elementUpdate: any = {};
        if (basicInfo.name.trim()) elementUpdate.name = basicInfo.name.trim();
        if (gasType) elementUpdate.gasType = gasType;

        if (Object.keys(elementUpdate).length > 0) {
          const elementResponse = await fetch(elementEndpoint, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(elementUpdate),
          });

          if (!elementResponse.ok) {
            throw new Error("Échec de la mise à jour de l'équipement");
          }
        }

        const nodeUpdate: any = {};
        if (basicInfo.buildingId !== undefined) nodeUpdate.buildingId = basicInfo.buildingId;
        if (basicInfo.floorId !== undefined) nodeUpdate.floorId = basicInfo.floorId;
        if (basicInfo.zoneId !== undefined) nodeUpdate.zoneId = basicInfo.zoneId;

        if (geoState.latitude != null) nodeUpdate.latitude = geoState.latitude;
        if (geoState.longitude != null) nodeUpdate.longitude = geoState.longitude;

        if (Object.keys(nodeUpdate).length > 0) {
          const nodeResponse = await fetch(`/api/synoptics/nodes/${node.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nodeUpdate),
          });

          if (!nodeResponse.ok) {
            throw new Error("Échec de la mise à jour du nœud");
          }
        }

        if (mediaState.newFiles.length > 0) {
          const mediaEndpoint = `/api/synoptics/${node.nodeType}s/${node.elementId}/media`;

          for (const file of mediaState.newFiles) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("elementType", node.nodeType);

            const mediaResponse = await fetch(mediaEndpoint, {
              method: "POST",
              body: formData,
            });

            if (!mediaResponse.ok) {
              throw new Error(`Échec du téléversement du fichier ${file.name}`);
            }
          }
        }
        const currentTargets = connectionsState.targetNodeIds ?? [];
        const toCreate = currentTargets.filter(
          (targetId) => !initialConnectionTargets.includes(targetId)
        );
        const toRemove = initialConnectionTargets.filter(
          (targetId) => !currentTargets.includes(targetId)
        );

        if (toCreate.length > 0) {
          const upstreamTargets = connectionsState.upstreamTargetNodeIds ?? [];
          const downstreamTargets = connectionsState.downstreamTargetNodeIds ?? [];

          for (const targetId of toCreate) {
            let fromNodeId = node.id;
            let toNodeId = targetId;

            if (upstreamTargets.includes(targetId)) {
              fromNodeId = targetId;
              toNodeId = node.id;
            } else if (downstreamTargets.includes(targetId)) {
              fromNodeId = node.id;
              toNodeId = targetId;
            }

            const connectionResponse = await fetch("/api/synoptics/connections", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                siteId,
                fromNodeId,
                toNodeId,
                gasType,
              }),
            });

            if (!connectionResponse.ok) {
              throw new Error("Échec de la création d'une connexion");
            }
          }
        }

        if (toRemove.length > 0) {
          for (const targetId of toRemove) {
            const existing = existingConnections.find(
              (connection) =>
                (connection.fromNodeId === node.id && connection.toNodeId === targetId) ||
                (connection.toNodeId === node.id && connection.fromNodeId === targetId)
            );
            if (!existing) continue;

            const deleteResponse = await fetch(
              `/api/synoptics/connections/${existing.id}`,
              {
                method: "DELETE",
              }
            );

            if (!deleteResponse.ok) {
              throw new Error("Échec de la suppression d'une connexion");
            }
          }
        }

        onOpenChange(false);
        if (onCompleted) {
          onCompleted({ nodeId: node.id, elementId: node.elementId });
        }
        return;
      }

      const createType = equipmentType;

      let elementEndpoint = "";
      const elementData: any = {
        siteId,
        name: basicInfo.name.trim() || `${createType} ${gasType}`,
      };

      if (createType === "valve") {
        elementEndpoint = "/api/synoptics/valves";
        elementData.valveType = "isolation";
        elementData.gasType = gasType;
        elementData.state = "closed";
      } else if (createType === "source") {
        elementEndpoint = "/api/synoptics/sources";
        elementData.gasType = gasType;
      } else if (createType === "fitting") {
        elementEndpoint = "/api/synoptics/fittings";
        elementData.fittingType = "tee";
        elementData.gasType = gasType;
      }

      const elementResponse = await fetch(elementEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(elementData),
      });

      if (!elementResponse.ok) {
        throw new Error("Échec de la création de l'équipement");
      }

      const createdElement = await elementResponse.json();

      const nodeData: any = {
        siteId,
        nodeType: createType,
        elementId: createdElement.id,
      };

      if (basicInfo.buildingId) nodeData.buildingId = basicInfo.buildingId;
      if (basicInfo.floorId) nodeData.floorId = basicInfo.floorId;
      if (basicInfo.zoneId) nodeData.zoneId = basicInfo.zoneId;

      if (geoState.latitude != null) nodeData.latitude = geoState.latitude;
      if (geoState.longitude != null) nodeData.longitude = geoState.longitude;

      const nodeResponse = await fetch("/api/synoptics/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nodeData),
      });

      if (!nodeResponse.ok) {
        throw new Error("Échec de la création du nœud");
      }

      const createdNode = await nodeResponse.json();

      if (mediaState.newFiles.length > 0) {
        const mediaEndpoint = `/api/synoptics/${createType}s/${createdElement.id}/media`;

        for (const file of mediaState.newFiles) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("elementType", createType);

          const mediaResponse = await fetch(mediaEndpoint, {
            method: "POST",
            body: formData,
          });

          if (!mediaResponse.ok) {
            throw new Error(`Échec du téléversement du fichier ${file.name}`);
          }
        }
      }

      const upstreamTargets = Array.from(
        new Set<string>(connectionsState.upstreamTargetNodeIds ?? [])
      );
      const downstreamTargets = Array.from(
        new Set<string>(connectionsState.downstreamTargetNodeIds ?? [])
      );

      if (upstreamTargets.length > 0 || downstreamTargets.length > 0) {
        for (const targetId of upstreamTargets) {
          const connectionResponse = await fetch("/api/synoptics/connections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              siteId,
              fromNodeId: targetId,
              toNodeId: createdNode.id,
              gasType,
            }),
          });

          if (!connectionResponse.ok) {
            throw new Error("Échec de la création d'une connexion");
          }
        }

        for (const targetId of downstreamTargets) {
          const connectionResponse = await fetch("/api/synoptics/connections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              siteId,
              fromNodeId: createdNode.id,
              toNodeId: targetId,
              gasType,
            }),
          });

          if (!connectionResponse.ok) {
            throw new Error("Échec de la création d'une connexion");
          }
        }
      }

      setBasicInfo({
        type: null,
        gasType: null,
        name: "",
        buildingId: null,
        floorId: null,
        zoneId: null,
      });
      setMediaState({ newFiles: [] });
      setGeoState({});
      setConnectionsState({ targetNodeIds: [], upstreamTargetNodeIds: [], downstreamTargetNodeIds: [] });

      onOpenChange(false);
      if (onCompleted) {
        onCompleted({ nodeId: createdNode.id, elementId: createdElement.id });
      }
    } catch (error) {
      console.error("EquipmentWizardDialog submit failed", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de l'enregistrement de l'équipement"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Créer un équipement" : "Modifier un équipement"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="basic">Infos</TabsTrigger>
            <TabsTrigger value="media">Photos</TabsTrigger>
            <TabsTrigger value="geo">Géolocalisation</TabsTrigger>
            <TabsTrigger value="connections">Connexions</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-4">
            {/* Onglet 1 : Infos de base */}
            <StepBasicInfo value={basicInfo} onChange={setBasicInfo} siteId={siteId} />
          </TabsContent>

          <TabsContent value="media" className="mt-4">
            {/* Onglet 2 : Médias */}
            <StepMedia
              value={mediaState}
              onChange={setMediaState}
              mode={mode}
              elementId={node?.elementId}
              elementType={node?.nodeType}
            />
          </TabsContent>

          <TabsContent value="geo" className="mt-4">
            {/* Onglet 3 : Géolocalisation */}
            <StepGeo
              value={geoState}
              onChange={setGeoState}
              siteLatitude={siteLatitude}
              siteLongitude={siteLongitude}
            />
          </TabsContent>

          <TabsContent value="connections" className="mt-4">
            {/* Onglet 4 : Connexions */}
            <StepConnections
              value={connectionsState}
              onChange={setConnectionsState}
              siteId={siteId}
              gasType={basicInfo.gasType ?? undefined}
            />
          </TabsContent>
        </Tabs>

        {submitError && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
            {submitError}
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" disabled={isSubmitDisabled} onClick={handleSubmit}>
            {mode === "create" ? "Créer" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
