'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Zap, Box } from 'lucide-react';
import ValveIcon from '../../../../icons/ValveIcon';
import { EquipmentDetailsRecord, EquipmentNode } from '../types';
import { GasTypeBadge } from '../../GasTypeBadge';

interface EquipmentListProps {
  nodes: EquipmentNode[];
  details: EquipmentDetailsRecord;
  isLoading: boolean;
  onAddToLayout: (nodeId: string) => void;
  totalAvailableCount: number;
  isSearchActive: boolean;
}

export function EquipmentList({
  nodes,
  details,
  isLoading,
  onAddToLayout,
  totalAvailableCount,
  isSearchActive,
}: EquipmentListProps) {
  return (
    <ScrollArea className="flex-1">
      <div className="p-3 space-y-1">
        {isLoading ? (
          <div className="text-center text-gray-500 py-8 text-sm">Chargement...</div>
        ) : nodes.length === 0 ? (
          <div className="text-center text-gray-500 py-8 text-sm">
            {totalAvailableCount === 0
              ? 'Tous les équipements sont dans ce layout'
              : isSearchActive
              ? 'Aucun équipement trouvé'
              : 'Aucun équipement disponible'}
          </div>
        ) : (
          nodes.map((node) => {
            const detail = details[node.id] || {};
            return (
              <div
                key={node.id}
                className="p-2 border rounded hover:bg-gray-50 transition-colors cursor-pointer group"
                onClick={() => onAddToLayout(node.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      {node.nodeType === 'source' && (
                        <Zap className="h-3 w-3 text-yellow-600 flex-shrink-0" />
                      )}
                      {node.nodeType === 'valve' && (
                        <ValveIcon className="h-3 w-3 text-blue-600 flex-shrink-0" />
                      )}
                      {node.nodeType === 'fitting' && (
                        <Box className="h-3 w-3 text-purple-600 flex-shrink-0" />
                      )}
                      <span className="font-medium text-xs truncate">
                        {detail.name || node.name || 'Sans nom'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {(detail.gasType || node.gasType) && (
                        <GasTypeBadge gasType={(detail.gasType || node.gasType) as string} />
                      )}
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
  );
}
