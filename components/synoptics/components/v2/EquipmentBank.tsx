'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Droplet, Zap, Box, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GasTypeBadge } from './GasTypeBadge';

interface EquipmentBankProps {
  siteId: string;
  layoutId: string;
  onAddToLayout: (nodeId: string) => void;
  onClose: () => void;
}

export function EquipmentBank({
  siteId,
  layoutId,
  onAddToLayout,
  onClose,
}: EquipmentBankProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'source' | 'valve' | 'fitting'>('all');

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

  // Fetch node positions to know which are already in this layout
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
              if (response.ok) {
                details[node.id] = await response.json();
              }
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

  // Filter out equipment already in this layout
  const positionedNodeIds = new Set(layoutPositions.map((p: any) => p.nodeId));
  const availableNodes = allNodes.filter((node: any) => !positionedNodeIds.has(node.id));

  // Apply filters
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
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Banque d'Équipements</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters */}
      <div className="p-4 space-y-3 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={selectedType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('all')}
            className="flex-1"
          >
            Tous
          </Button>
          <Button
            variant={selectedType === 'valve' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('valve')}
          >
            <Droplet className="h-3 w-3" />
          </Button>
          <Button
            variant={selectedType === 'source' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('source')}
          >
            <Zap className="h-3 w-3" />
          </Button>
          <Button
            variant={selectedType === 'fitting' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('fitting')}
          >
            <Box className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Equipment List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {isLoading ? (
            <div className="text-center text-gray-500 py-8">
              Chargement...
            </div>
          ) : filteredNodes.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {availableNodes.length === 0 
                ? 'Tous les équipements sont déjà dans ce layout'
                : 'Aucun équipement trouvé'}
            </div>
          ) : (
            filteredNodes.map((node: any) => {
              const details = equipmentDetails[node.id] || {};
              return (
                <div
                  key={node.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => onAddToLayout(node.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {node.nodeType === 'source' && <Zap className="h-4 w-4 text-yellow-600 flex-shrink-0" />}
                        {node.nodeType === 'valve' && <Droplet className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                        {node.nodeType === 'fitting' && <Box className="h-4 w-4 text-purple-600 flex-shrink-0" />}
                        <span className="font-medium text-sm truncate">
                          {details.name || 'Sans nom'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {details.gasType && <GasTypeBadge gasType={details.gasType} />}
                        <Badge variant="outline" className="text-xs capitalize">
                          {node.nodeType}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToLayout(node.id);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          {availableNodes.length} équipement{availableNodes.length !== 1 ? 's' : ''} disponible{availableNodes.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
