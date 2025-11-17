'use client';

import { Loader2, Zap, Box, Edit, Trash2 } from 'lucide-react';
import ValveIcon from '../../../icons/ValveIcon';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GasTypeBadge } from '../GasTypeBadge';
import { EquipmentLocationBreadcrumb } from '../EquipmentLocationBreadcrumb';
import type { EquipmentFeature } from '../SiteEquipmentMap';

interface FloorSummary {
  id: string;
  name: string;
}

interface BuildingSummary {
  id: string;
  name: string;
  floors?: FloorSummary[];
}

interface EquipmentListViewProps {
  isLoading: boolean;
  equipment: EquipmentFeature[];
  hasEquipment: boolean;
  layouts: any[];
  nodePositions: Record<string, any[]>;
  siteId: string;
  onDelete: (id: string) => void;
  onEquipmentClick: (item: EquipmentFeature) => void;
}

export function EquipmentListView({
  isLoading,
  equipment,
  hasEquipment,
  layouts,
  nodePositions,
  siteId,
  onDelete,
  onEquipmentClick,
}: EquipmentListViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (equipment.length === 0) {
    return (
      <div className="px-6 py-20 text-center">
        <p className="text-sm text-gray-600">
          {hasEquipment ? 'No equipment matches the current filters' : 'No equipment available yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <ScrollArea className="h-[600px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Gaz</TableHead>
              <TableHead>Localisation</TableHead>
              <TableHead>Layout</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipment.map((item) => {
              const positions = nodePositions[item.id] || [];

              return (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => onEquipmentClick(item)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.nodeType === 'source' && (
                        <Zap className="h-4 w-4 text-yellow-600" />
                      )}
                      {item.nodeType === 'valve' && (
                        <ValveIcon className="h-4 w-4 text-black" />
                      )}
                      {item.nodeType === 'fitting' && (
                        <Box className="h-4 w-4 text-purple-600" />
                      )}
                      <span className="capitalize text-sm text-gray-700">{item.nodeType}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-sm text-gray-900">
                    {item.name}
                  </TableCell>
                  <TableCell>
                    <GasTypeBadge gasType={item.gasType} />
                  </TableCell>
                  <TableCell>
                    <EquipmentLocationBreadcrumb
                      node={item}
                      siteId={siteId}
                      variant="compact"
                    />
                  </TableCell>
                  <TableCell>
                    {positions.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1">
                        {positions.map((pos: any) => {
                          const layout = layouts.find((l: any) => l.id === pos.layoutId);
                          return (
                            <Badge key={pos.id} variant="secondary" className="text-xs">
                              {layout?.name || 'Unknown'}
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEquipmentClick(item);
                        }}
                        title="Edit equipment"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.id);
                        }}
                        title="Delete equipment"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
