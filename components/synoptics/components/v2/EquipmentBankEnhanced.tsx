
"use client";

import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useUIStore } from '../../stores/ui-store';
import { EquipmentWizardDialog } from './equipment-wizard/EquipmentWizardDialog';
import { EquipmentBankHeader } from './equipment-bank/components/EquipmentBankHeader';
import { EquipmentFilters } from './equipment-bank/components/EquipmentFilters';
import { EquipmentList } from './equipment-bank/components/EquipmentList';
import { EquipmentFooter } from './equipment-bank/components/EquipmentFooter';
import { SelectedEquipmentSection } from './equipment-bank/components/SelectedEquipmentSection';
import {
  useEquipmentList,
  useLayoutPositions,
  useEquipmentDetails,
  useSelectedEquipment,
} from './equipment-bank/hooks/useEquipmentQueries';
import { EquipmentBankEnhancedProps } from './equipment-bank/types';

export function EquipmentBankEnhanced({
  siteId,
  layoutId,
  layout,
  onAddToLayout,
  onClose,
}: EquipmentBankEnhancedProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const selectedElementId = useUIStore((state) => state.selectedElementId);
  const selectElement = useUIStore((state) => state.selectElement);

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'source' | 'valve' | 'fitting'>('all');
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Data queries
  const { data: allNodes = [], isLoading: isLoadingNodes } = useEquipmentList(siteId);
  const { data: layoutPositions = [] } = useLayoutPositions(layoutId);
  const { data: equipmentDetails = {} } = useEquipmentDetails(allNodes, {
    enabled: allNodes.length > 0,
  });
  const { data: selectedElement, isLoading: isLoadingSelected } = useSelectedEquipment(
    selectedElementId,
    allNodes
  );

  // Computed values
  const positionedNodeIds = useMemo(
    () => new Set(layoutPositions.map((p) => p.nodeId)),
    [layoutPositions]
  );

  const availableNodes = useMemo(
    () => allNodes.filter((node) => !positionedNodeIds.has(node.id)),
    [allNodes, positionedNodeIds]
  );

  const filteredNodes = useMemo(() => {
    return availableNodes.filter((node) => {
      const matchesType = selectedType === 'all' || node.nodeType === selectedType;
      const details = equipmentDetails[node.id];
      const searchLower = searchTerm.toLowerCase();

      const matchesSearch =
        !searchTerm ||
        details?.name?.toLowerCase().includes(searchLower) ||
        node.nodeType.toLowerCase().includes(searchLower) ||
        details?.gasType?.toLowerCase().includes(searchLower);

      return matchesType && matchesSearch;
    });
  }, [availableNodes, selectedType, equipmentDetails, searchTerm]);

  // Remove from layout mutation
  const removeFromLayoutMutation = useMutation({
    mutationFn: async (nodeId: string) => {
      const positionId = `${nodeId}-${layoutId}`;
      const response = await fetch(`/api/synoptics/node-positions/${positionId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove from layout');
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['layout', layoutId] });
      await queryClient.refetchQueries({ queryKey: ['layout-positions', layoutId] });
      await queryClient.refetchQueries({ queryKey: ['site-equipment', siteId] });
      selectElement(null);
      router.refresh();
    },
    onError: (error) => {
      console.error('❌ Failed to remove from layout:', error);
      alert('Échec de la suppression du layout');
    },
  });

  // Rotate equipment mutation with robust position finding
  const rotateMutation = useMutation({
    mutationFn: async ({ nodeId, currentRotation }: { nodeId: string; currentRotation: number }) => {
      let position = null;

      // 1. Try selectedElement first (most reliable)
      if (selectedElement?.id === nodeId && selectedElement?.position) {
        const xPos = parseFloat(String(selectedElement.position.xPosition || selectedElement.position.x || 0)) || 0;
        const yPos = parseFloat(String(selectedElement.position.yPosition || selectedElement.position.y || 0)) || 0;
        position = {
          nodeId,
          layoutId,
          xPosition: xPos.toString(),
          yPosition: yPos.toString(),
          rotation: selectedElement.position.rotation || 0,
        };
      }

      // 2. Try layoutPositions
      if (!position) {
        position = layoutPositions.find((p) => p.nodeId === nodeId);
      }

      // 3. Try layout.nodes
      if (!position && layout?.nodes) {
        const node = layout.nodes.find((n: any) => n.id === nodeId);
        if (node?.position) {
          const xPos = parseFloat(String(node.position.xPosition || node.position.x || 0)) || 0;
          const yPos = parseFloat(String(node.position.yPosition || node.position.y || 0)) || 0;
          position = {
            nodeId,
            layoutId,
            xPosition: xPos.toString(),
            yPosition: yPos.toString(),
            rotation: node.position.rotation || 0,
          };
        }
      }

      // 4. API fallback
      if (!position) {
        try {
          const response = await fetch(`/api/synoptics/node-positions?nodeId=${nodeId}`);
          if (response.ok) {
            const remotePositions = await response.json();
            const matchingPosition = Array.isArray(remotePositions)
              ? remotePositions.find((p: any) => p.layoutId === layoutId)
              : null;

            if (matchingPosition) {
              position = {
                nodeId,
                layoutId,
                xPosition: (matchingPosition.xPosition ?? matchingPosition.x ?? 0).toString(),
                yPosition: (matchingPosition.yPosition ?? matchingPosition.y ?? 0).toString(),
                rotation: matchingPosition.rotation || 0,
              };
            }
          }
        } catch (apiError) {
          console.error('⚠️ API fallback error:', apiError);
        }
      }

      if (!position) {
        throw new Error('Équipement non trouvé dans le layout');
      }

      const newRotation = (currentRotation + 90) % 360;

      const response = await fetch(`/api/synoptics/node-positions/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId,
          layoutId,
          xPosition: parseFloat(position.xPosition),
          yPosition: parseFloat(position.yPosition),
          rotation: newRotation,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Rotation failed:', error);
        throw new Error('Failed to rotate');
      }

      return await response.json();
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['layout', layoutId] });
      await queryClient.refetchQueries({ queryKey: ['layout-positions', layoutId] });
      router.refresh();
    },
    onError: (error) => {
      console.error('❌ Rotation failed:', error);
      alert('Échec de la rotation');
    },
  });

  const handleClearSelection = () => {
    selectElement(null);
  };

  const handleOpenEdit = () => {
    setShowEditDialog(true);
  };

  const handleRotate = () => {
    if (!selectedElement) return;

    let currentRotation = 0;
    if (selectedElement?.position) {
      currentRotation = selectedElement.position.rotation || 0;
    } else {
      const position = layoutPositions.find((p) => p.nodeId === selectedElement.id);
      if (position) {
        currentRotation = position.rotation || 0;
      } else if (layout?.nodes) {
        const node = layout.nodes.find((n: any) => n.id === selectedElement.id);
        currentRotation = node?.position?.rotation || 0;
      }
    }

    rotateMutation.mutate({ nodeId: selectedElement.id, currentRotation });
  };

  const handleRemoveFromLayout = () => {
    if (!selectedElement || !confirm('Retirer cet équipement du layout ?')) return;
    removeFromLayoutMutation.mutate(selectedElement.id);
  };

  const disableActions = rotateMutation.isPending;
  const disableRemove = removeFromLayoutMutation.isPending;

  const handleImportAllToLayout = () => {
    if (!availableNodes.length) return;

    const maxToImport = 100;
    const nodesToImport = availableNodes.slice(0, maxToImport);

    nodesToImport.forEach((node) => {
      onAddToLayout(node.id);
    });
  };

  return (
    <div className="w-80 bg-white border-l shadow-lg h-full flex flex-col">
      <EquipmentBankHeader onClose={onClose} />

      <div className="px-4 pt-2 pb-3">
        <Button
          type="button"
          className="w-full justify-center"
          variant="outline"
          onClick={() => setShowCreateWizard(true)}
        >
          Ajouter un équipement
        </Button>
      </div>

      <SelectedEquipmentSection
        selectedEquipmentId={selectedElementId}
        selectedEquipment={selectedElement}
        isLoading={isLoadingSelected}
        onClearSelection={handleClearSelection}
        onOpenEdit={handleOpenEdit}
        onRotate={handleRotate}
        onRemoveFromLayout={handleRemoveFromLayout}
        disableActions={disableActions}
        disableRemove={disableRemove}
      />

      <EquipmentFilters
        searchTerm={searchTerm}
        selectedType={selectedType}
        onSearchChange={setSearchTerm}
        onTypeChange={setSelectedType}
      />

      <EquipmentList
        nodes={filteredNodes}
        details={equipmentDetails}
        isLoading={isLoadingNodes}
        onAddToLayout={onAddToLayout}
        totalAvailableCount={availableNodes.length}
        isSearchActive={!!searchTerm}
      />

      <EquipmentFooter
        availableCount={availableNodes.length}
        onImportAll={handleImportAllToLayout}
      />

      <EquipmentWizardDialog
        open={showCreateWizard}
        mode="create"
        siteId={siteId}
        onOpenChange={setShowCreateWizard}
        onCompleted={() => {
          setShowCreateWizard(false);
          queryClient.invalidateQueries({ queryKey: ['site-equipment', siteId] });
          queryClient.invalidateQueries({ queryKey: ['equipment-details'] });
        }}
      />

      {selectedElement && (
        <EquipmentWizardDialog
          open={showEditDialog}
          mode="edit"
          siteId={siteId}
          onOpenChange={setShowEditDialog}
          node={selectedElement as any}
          onCompleted={() => {
            setShowEditDialog(false);
            queryClient.invalidateQueries({ queryKey: ['site-equipment', siteId] });
            queryClient.invalidateQueries({ queryKey: ['equipment-details'] });
            queryClient.invalidateQueries({ queryKey: ['selected-equipment'] });
          }}
        />
      )}
    </div>
  );
}
