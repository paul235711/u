/**
 * Equipment Manager - Vue unifiée de tous les équipements d'un site
 * Permet de consulter, filtrer et gérer tous les nodes/équipements
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Droplet, Zap, Box, Filter, Search, Edit, Trash2, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { GasTypeBadge } from './GasTypeBadge';
import { EquipmentLocationBreadcrumb } from './EquipmentLocationBreadcrumb';
import { EquipmentEditDialog } from './EquipmentEditDialog';
import { EquipmentDeleteDialog } from './EquipmentDeleteDialog';
import { EquipmentCreateDialog } from './EquipmentCreateDialog';
import type { GasType } from '@/components/synoptics/hierarchy/gas-indicators';

interface EquipmentManagerProps {
  siteId: string;
  organizationId: string;
}

export function EquipmentManager({ siteId, organizationId }: EquipmentManagerProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'source' | 'valve' | 'fitting'>('all');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [editingNode, setEditingNode] = useState<any>(null);
  const [deletingNodes, setDeletingNodes] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch all nodes for the site (filtered by siteId)
  const { data: allNodes = [], isLoading } = useQuery({
    queryKey: ['site-equipment', siteId, organizationId],
    queryFn: async () => {
      if (!organizationId) {
        console.warn('No organizationId provided');
        return [];
      }
      // Filter by siteId to only get equipment for this specific site
      const response = await fetch(`/api/synoptics/nodes?organizationId=${organizationId}&siteId=${siteId}`);
      if (!response.ok) throw new Error('Failed to fetch equipment');
      return response.json();
    },
    enabled: !!organizationId && !!siteId,
  });

  // Fetch hierarchy to verify nodes belong to this site
  const { data: hierarchyData } = useQuery({
    queryKey: ['site-hierarchy', siteId],
    queryFn: async () => {
      const response = await fetch(`/api/synoptics/sites/${siteId}/hierarchy`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!siteId,
    staleTime: 30000,
  });

  // Filter nodes to only include those from this site
  const nodes = allNodes.filter((node: any) => {
    if (!hierarchyData) return false;
    
    // Check if node's building belongs to this site
    if (node.buildingId) {
      const building = hierarchyData.buildings?.find((b: any) => b.id === node.buildingId);
      return !!building;
    }
    
    // Check if node's floor belongs to this site
    if (node.floorId) {
      let found = false;
      hierarchyData.buildings?.forEach((b: any) => {
        if (b.floors?.some((f: any) => f.id === node.floorId)) {
          found = true;
        }
      });
      return found;
    }
    
    // Check if node's zone belongs to this site
    if (node.zoneId) {
      let found = false;
      hierarchyData.buildings?.forEach((b: any) => {
        b.floors?.forEach((f: any) => {
          if (f.zones?.some((z: any) => z.id === node.zoneId)) {
            found = true;
          }
        });
      });
      return found;
    }
    
    return false;
  });

  // Fetch les détails des équipements (valves, sources, fittings)
  const { data: equipmentDetails = {} } = useQuery({
    queryKey: ['equipment-details', nodes.map((n: any) => n.id)],
    queryFn: async () => {
      const details: Record<string, any> = {};
      
      await Promise.all(
        nodes.map(async (node: any) => {
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
    enabled: nodes.length > 0,
  });

  // Filtrage
  const filteredNodes = nodes.filter((node: any) => {
    const matchesType = selectedType === 'all' || node.nodeType === selectedType;
    const details = equipmentDetails[node.id];
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = !searchTerm || 
      details?.name?.toLowerCase().includes(searchLower) ||
      node.nodeType.toLowerCase().includes(searchLower) ||
      details?.gasType?.toLowerCase().includes(searchLower);
    
    return matchesType && matchesSearch;
  });

  // Statistiques
  const stats = {
    total: nodes.length,
    sources: nodes.filter((n: any) => n.nodeType === 'source').length,
    valves: nodes.filter((n: any) => n.nodeType === 'valve').length,
    fittings: nodes.filter((n: any) => n.nodeType === 'fitting').length,
  };

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No organization found. Please ensure you have access to this site.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading equipment...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total"
          value={stats.total}
          icon={Box}
          color="blue"
          active={selectedType === 'all'}
          onClick={() => setSelectedType('all')}
        />
        <StatCard
          label="Sources"
          value={stats.sources}
          icon={Zap}
          color="yellow"
          active={selectedType === 'source'}
          onClick={() => setSelectedType('source')}
        />
        <StatCard
          label="Vannes"
          value={stats.valves}
          icon={Droplet}
          color="green"
          active={selectedType === 'valve'}
          onClick={() => setSelectedType('valve')}
        />
        <StatCard
          label="Raccords"
          value={stats.fittings}
          icon={Box}
          color="purple"
          active={selectedType === 'fitting'}
          onClick={() => setSelectedType('fitting')}
        />
      </div>

      {/* Barre de recherche et Edit Mode */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom, type, gaz..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={isEditMode ? 'default' : 'outline'}
          onClick={() => {
            setIsEditMode(!isEditMode);
            setSelectedNodes(new Set());
          }}
        >
          <Edit className="h-4 w-4 mr-2" />
          {isEditMode ? 'Exit Edit Mode' : 'Edit Mode'}
        </Button>
        {isEditMode && selectedNodes.size > 0 && (
          <Button
            variant="destructive"
            onClick={() => setDeletingNodes(Array.from(selectedNodes))}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete ({selectedNodes.size})
          </Button>
        )}
        {isEditMode && (
          <Button
            variant="outline"
            onClick={() => setIsCreating(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Equipment
          </Button>
        )}
      </div>

      {/* Tabs par type */}
      <Tabs value={selectedType} onValueChange={(v: string) => setSelectedType(v as any)}>
        <TabsList>
          <TabsTrigger value="all">Tous ({stats.total})</TabsTrigger>
          <TabsTrigger value="source">Sources ({stats.sources})</TabsTrigger>
          <TabsTrigger value="valve">Vannes ({stats.valves})</TabsTrigger>
          <TabsTrigger value="fitting">Raccords ({stats.fittings})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedType} className="mt-4">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  {isEditMode && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedNodes.size === filteredNodes.length && filteredNodes.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedNodes(new Set(filteredNodes.map((n: any) => n.id)));
                          } else {
                            setSelectedNodes(new Set());
                          }
                        }}
                      />
                    </TableHead>
                  )}
                  <TableHead>Type</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Gaz</TableHead>
                  <TableHead>Localisation</TableHead>
                  {isEditMode && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isEditMode ? 6 : 5} className="text-center text-gray-500 py-8">
                      Aucun équipement trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNodes.map((node: any) => {
                    const details = equipmentDetails[node.id] || {};
                    return (
                      <TableRow key={node.id}>
                        {isEditMode && (
                          <TableCell>
                            <Checkbox
                              checked={selectedNodes.has(node.id)}
                              onCheckedChange={(checked) => {
                                const newSelected = new Set(selectedNodes);
                                if (checked) {
                                  newSelected.add(node.id);
                                } else {
                                  newSelected.delete(node.id);
                                }
                                setSelectedNodes(newSelected);
                              }}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {node.nodeType === 'source' && <Zap className="h-4 w-4 text-yellow-600" />}
                            {node.nodeType === 'valve' && <Droplet className="h-4 w-4 text-blue-600" />}
                            {node.nodeType === 'fitting' && <Box className="h-4 w-4 text-purple-600" />}
                            <span className="capitalize">{node.nodeType}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {details.name || 'Sans nom'}
                        </TableCell>
                        <TableCell>
                          {details.gasType ? (
                            <GasTypeBadge gasType={details.gasType} />
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <EquipmentLocationBreadcrumb node={node} siteId={siteId} />
                        </TableCell>
                        {isEditMode && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setEditingNode({ ...node, details })}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setDeletingNodes([node.id])}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {editingNode && (
        <EquipmentEditDialog
          open={!!editingNode}
          onOpenChange={(open) => !open && setEditingNode(null)}
          node={editingNode}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['site-equipment', siteId, organizationId] });
            queryClient.invalidateQueries({ queryKey: ['equipment-details'] });
          }}
        />
      )}

      {/* Delete Dialog */}
      <EquipmentDeleteDialog
        open={deletingNodes.length > 0}
        onOpenChange={(open) => !open && setDeletingNodes([])}
        nodeIds={deletingNodes}
        nodes={nodes}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['site-equipment', siteId, organizationId] });
          setSelectedNodes(new Set());
        }}
      />

      {/* Create Dialog */}
      <EquipmentCreateDialog
        open={isCreating}
        onOpenChange={setIsCreating}
        siteId={siteId}
        organizationId={organizationId}
        hierarchyData={hierarchyData}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['site-equipment', siteId, organizationId] });
          queryClient.invalidateQueries({ queryKey: ['equipment-details'] });
          queryClient.invalidateQueries({ queryKey: ['site-hierarchy', siteId] });
        }}
      />
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color, 
  active,
  onClick 
}: { 
  label: string; 
  value: number; 
  icon: any; 
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  }[color];

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
        active ? colorClasses : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm text-gray-600">{label}</div>
        </div>
        <Icon className={`h-8 w-8 ${active ? '' : 'text-gray-400'}`} />
      </div>
    </button>
  );
}

