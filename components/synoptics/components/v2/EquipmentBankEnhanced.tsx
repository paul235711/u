
'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useUIStore } from '../../stores/ui-store';
import { EquipmentEditDialog } from './EquipmentEditDialog';
import { EquipmentBankHeader } from './equipment-bank/components/EquipmentBankHeader';
import { CreateEquipmentSection } from './equipment-bank/components/CreateEquipmentSection';
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
import { GasOptionValue } from './equipment-bank/constants';

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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Create form state
  const [createType, setCreateType] = useState<'valve' | 'source' | 'fitting'>('valve');
  const [createName, setCreateName] = useState('');
  const [createGas, setCreateGas] = useState<GasOptionValue>('oxygen');

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

  // Create equipment mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      let elementEndpoint = '';
      let elementData: any = { siteId, name: createName.trim() };

      if (createType === 'valve') {
        elementEndpoint = '/api/synoptics/valves';
        elementData.valveType = 'isolation';
        elementData.gasType = createGas;
        elementData.state = 'closed';
      } else if (createType === 'source') {
        elementEndpoint = '/api/synoptics/sources';
        elementData.gasType = createGas;
      } else if (createType === 'fitting') {
        elementEndpoint = '/api/synoptics/fittings';
        elementData.fittingType = 'tee';
        elementData.gasType = createGas;
      }

      const elementResponse = await fetch(elementEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(elementData),
      });
      if (!elementResponse.ok) throw new Error('Failed to create element');
      const element = await elementResponse.json();

      const nodeResponse = await fetch('/api/synoptics/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          nodeType: createType,
          elementId: element.id,
        }),
      });
      if (!nodeResponse.ok) throw new Error('Failed to create node');
      return nodeResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-equipment', siteId] });
      setCreateName('');
      setShowCreateForm(false);
    },
  });

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

  return (
    <div className="w-80 bg-white border-l shadow-lg h-full flex flex-col">
      <EquipmentBankHeader onClose={onClose} />

      <CreateEquipmentSection
        isOpen={showCreateForm}
        createType={createType}
        createName={createName}
        createGas={createGas}
        isSubmitting={createMutation.isPending}
        onToggle={() => setShowCreateForm(!showCreateForm)}
        onTypeChange={setCreateType}
        onNameChange={setCreateName}
        onGasChange={setCreateGas}
        onSubmit={() => createMutation.mutate()}
      />

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

      <EquipmentFooter availableCount={availableNodes.length} />

      <EquipmentEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        node={selectedElement}
        onSuccess={() => {
          setShowEditDialog(false);
          queryClient.invalidateQueries({ queryKey: ['site-equipment', siteId] });
          queryClient.invalidateQueries({ queryKey: ['equipment-details'] });
          queryClient.invalidateQueries({ queryKey: ['selected-equipment'] });
        }}
        siteId={siteId}
        siteLatitude={parseFloat((selectedElement as any)?.siteLatitude ?? '') || undefined}
        siteLongitude={parseFloat((selectedElement as any)?.siteLongitude ?? '') || undefined}
      />
    </div>
  );
}
