'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Droplet, Zap, Box, X, ChevronDown, ChevronRight, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { GasTypeBadge } from './GasTypeBadge';
import { useUIStore } from '../../stores/ui-store';
import { useRouter } from 'next/navigation';

interface EquipmentBankEnhancedProps {
  siteId: string;
  layoutId: string;
  onAddToLayout: (nodeId: string) => void;
  onClose: () => void;
}

const GAS_OPTIONS = [
  { value: 'oxygen', label: 'O₂', color: 'bg-red-500' },
  { value: 'medical_air', label: 'Air', color: 'bg-yellow-500' },
  { value: 'nitrous_oxide', label: 'N₂O', color: 'bg-blue-500' },
  { value: 'carbon_dioxide', label: 'CO₂', color: 'bg-green-500' },
  { value: 'nitrogen', label: 'N₂', color: 'bg-gray-500' },
  { value: 'vacuum', label: 'Vac', color: 'bg-purple-500' },
];

export function EquipmentBankEnhanced({
  siteId,
  layoutId,
  onAddToLayout,
  onClose,
}: EquipmentBankEnhancedProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const selectedElementId = useUIStore((state) => state.selectedElementId);
  const selectElement = useUIStore((state) => state.selectElement);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'source' | 'valve' | 'fitting'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Create form state
  const [createType, setCreateType] = useState<'valve' | 'source' | 'fitting'>('valve');
  const [createName, setCreateName] = useState('');
  const [createGas, setCreateGas] = useState('oxygen');

  // Fetch all site equipment
  const { data: allNodes = [], isLoading } = useQuery({
    queryKey: ['site-equipment', siteId],
    queryFn: async () => {
      const response = await fetch(`/api/synoptics/nodes?siteId=${siteId}`);
      if (!response.ok) throw new Error('Failed to fetch equipment');
      return response.json();
    },
    enabled: !!siteId,
  });

  // Fetch node positions
  const { data: layoutPositions = [] } = useQuery({
    queryKey: ['layout-positions', layoutId],
    queryFn: async () => {
      const response = await fetch(`/api/synoptics/node-positions?layoutId=${layoutId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!layoutId,
  });

  // Fetch equipment details
  const { data: equipmentDetails = {} } = useQuery({
    queryKey: ['equipment-details', allNodes.map((n: any) => n.id)],
    queryFn: async () => {
      const details: Record<string, any> = {};
      await Promise.all(
        allNodes.map(async (node: any) => {
          try {
            let endpoint = '';
            if (node.nodeType === 'valve') endpoint = `/api/synoptics/valves/${node.elementId}`;
            else if (node.nodeType === 'source') endpoint = `/api/synoptics/sources/${node.elementId}`;
            else if (node.nodeType === 'fitting') endpoint = `/api/synoptics/fittings/${node.elementId}`;
            
            if (endpoint) {
              const response = await fetch(endpoint);
              if (response.ok) details[node.id] = await response.json();
            }
          } catch (error) {
            console.error(`Failed to fetch details for ${node.id}:`, error);
          }
        })
      );
      return details;
    },
    enabled: allNodes.length > 0,
  });

  // Fetch selected element details for editing
  const { data: selectedElement } = useQuery({
    queryKey: ['element-details', selectedElementId],
    queryFn: async () => {
      if (!selectedElementId) return null;
      const node = allNodes.find((n: any) => n.id === selectedElementId);
      if (!node) return null;
      
      // Fetch fresh element details
      let endpoint = '';
      if (node.nodeType === 'valve') endpoint = `/api/synoptics/valves/${node.elementId}`;
      else if (node.nodeType === 'source') endpoint = `/api/synoptics/sources/${node.elementId}`;
      else if (node.nodeType === 'fitting') endpoint = `/api/synoptics/fittings/${node.elementId}`;
      
      if (endpoint) {
        const response = await fetch(endpoint);
        if (response.ok) {
          const details = await response.json();
          return { ...node, ...details };
        }
      }
      return node;
    },
    enabled: !!selectedElementId && allNodes.length > 0,
  });

  // Create equipment mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      // Step 1: Get organizationId from site
      const siteResponse = await fetch(`/api/synoptics/sites/${siteId}`);
      if (!siteResponse.ok) throw new Error('Failed to fetch site');
      const site = await siteResponse.json();

      // Step 2: Create element
      let elementEndpoint = '';
      let elementData: any = { organizationId: site.organizationId, name: createName.trim() };

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

      // Step 3: Create node
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

  // Delete equipment mutation
  const deleteMutation = useMutation({
    mutationFn: async (nodeId: string) => {
      await fetch(`/api/synoptics/nodes/${nodeId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-equipment', siteId] });
      queryClient.invalidateQueries({ queryKey: ['layout', layoutId] });
      selectElement(null);
      router.refresh();
    },
  });

  const positionedNodeIds = new Set(layoutPositions.map((p: any) => p.nodeId));
  const availableNodes = allNodes.filter((node: any) => !positionedNodeIds.has(node.id));

  const filteredNodes = availableNodes.filter((node: any) => {
    const matchesType = selectedType === 'all' || node.nodeType === selectedType;
    const details = equipmentDetails[node.id];
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = !searchTerm || 
      details?.name?.toLowerCase().includes(searchLower) ||
      node.nodeType.toLowerCase().includes(searchLower) ||
      details?.gasType?.toLowerCase().includes(searchLower);
    
    return matchesType && matchesSearch;
  });

  return (
    <div className="w-80 bg-white border-l shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between bg-gray-50">
        <h3 className="font-semibold text-sm">Équipements</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Create Section */}
      <div className="border-b">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 text-sm font-medium"
        >
          <span className="flex items-center gap-2">
            {showCreateForm ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Créer Nouvel Équipement
          </span>
          <Plus className="h-4 w-4 text-blue-600" />
        </button>
        
        {showCreateForm && (
          <div className="p-3 bg-gray-50 border-t space-y-3">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={createType === 'valve' ? 'default' : 'outline'}
                onClick={() => setCreateType('valve')}
                className="flex-1"
              >
                <Droplet className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant={createType === 'source' ? 'default' : 'outline'}
                onClick={() => setCreateType('source')}
                className="flex-1"
              >
                <Zap className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant={createType === 'fitting' ? 'default' : 'outline'}
                onClick={() => setCreateType('fitting')}
                className="flex-1"
              >
                <Box className="h-3 w-3" />
              </Button>
            </div>

            <Input
              placeholder="Nom de l'équipement"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="h-8 text-sm"
            />

            <div>
              <Label className="text-xs text-gray-600">Type de gaz</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {GAS_OPTIONS.map((gas) => (
                  <button
                    key={gas.value}
                    type="button"
                    onClick={() => setCreateGas(gas.value)}
                    className={`px-2 py-1 text-xs font-medium text-white rounded transition-all ${gas.color} ${
                      createGas === gas.value ? 'ring-2 ring-offset-1 ring-blue-500' : 'opacity-50 hover:opacity-100'
                    }`}
                  >
                    {gas.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => createMutation.mutate()}
              disabled={!createName.trim() || createMutation.isPending}
              className="w-full"
            >
              {createMutation.isPending ? (
                <><Loader2 className="h-3 w-3 mr-2 animate-spin" />Création...</>
              ) : (
                'Créer'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Selected Element Editor */}
      {selectedElementId && (
        <div className="border-b bg-blue-50 p-3 space-y-2">
          {selectedElement ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedElement.nodeType === 'source' && <Zap className="h-4 w-4 text-yellow-600" />}
                  {selectedElement.nodeType === 'valve' && <Droplet className="h-4 w-4 text-blue-600" />}
                  {selectedElement.nodeType === 'fitting' && <Box className="h-4 w-4 text-purple-600" />}
                  <span className="font-medium text-sm">{selectedElement.name || 'Sans nom'}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => selectElement(null)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-7"
                  onClick={() => {/* TODO: Ouvrir EquipmentEditDialog */}}
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 px-2"
                  onClick={() => deleteMutation.mutate(selectedElement.id)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement...
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="p-3 space-y-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-7 h-8 text-sm"
          />
        </div>
        
        <div className="flex gap-1">
          <Button
            variant={selectedType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('all')}
            className="flex-1 h-7 text-xs"
          >
            Tous
          </Button>
          <Button
            variant={selectedType === 'valve' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('valve')}
            className="h-7 px-2"
          >
            <Droplet className="h-3 w-3" />
          </Button>
          <Button
            variant={selectedType === 'source' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('source')}
            className="h-7 px-2"
          >
            <Zap className="h-3 w-3" />
          </Button>
          <Button
            variant={selectedType === 'fitting' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('fitting')}
            className="h-7 px-2"
          >
            <Box className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Equipment List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {isLoading ? (
            <div className="text-center text-gray-500 py-8 text-sm">
              Chargement...
            </div>
          ) : filteredNodes.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-sm">
              {availableNodes.length === 0 
                ? 'Tous les équipements sont dans ce layout'
                : 'Aucun équipement trouvé'}
            </div>
          ) : (
            filteredNodes.map((node: any) => {
              const details = equipmentDetails[node.id] || {};
              return (
                <div
                  key={node.id}
                  className="p-2 border rounded hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => onAddToLayout(node.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        {node.nodeType === 'source' && <Zap className="h-3 w-3 text-yellow-600 flex-shrink-0" />}
                        {node.nodeType === 'valve' && <Droplet className="h-3 w-3 text-blue-600 flex-shrink-0" />}
                        {node.nodeType === 'fitting' && <Box className="h-3 w-3 text-purple-600 flex-shrink-0" />}
                        <span className="font-medium text-xs truncate">
                          {details.name || 'Sans nom'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {details.gasType && <GasTypeBadge gasType={details.gasType} />}
                      </div>
                    </div>
                    <Plus className="h-4 w-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t bg-gray-50 text-center">
        <p className="text-xs text-gray-500">
          {availableNodes.length} disponible{availableNodes.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
