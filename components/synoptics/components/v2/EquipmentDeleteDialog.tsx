'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface EquipmentDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeIds: string[];
  nodes: any[];
  onSuccess: () => void;
}

export function EquipmentDeleteDialog({ 
  open, 
  onOpenChange, 
  nodeIds, 
  nodes,
  onSuccess 
}: EquipmentDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      // Delete each node and its related data
      await Promise.all(
        nodeIds.map(async (nodeId) => {
          const node = nodes.find((n: any) => n.id === nodeId);
          if (!node) return;

          // Step 1: Delete node positions (if any exist in layouts)
          // The API should handle cascade delete, but we ensure cleanup
          
          // Step 2: Delete the node (this will cascade to connections and positions)
          await fetch(`/api/synoptics/nodes/${nodeId}`, { method: 'DELETE' });

          // Step 3: Delete the element (valve, source, fitting)
          // This is done after node deletion to avoid foreign key issues
          let elementEndpoint = '';
          if (node.nodeType === 'valve') elementEndpoint = `/api/synoptics/valves/${node.elementId}`;
          else if (node.nodeType === 'source') elementEndpoint = `/api/synoptics/sources/${node.elementId}`;
          else if (node.nodeType === 'fitting') elementEndpoint = `/api/synoptics/fittings/${node.elementId}`;
          
          if (elementEndpoint) {
            await fetch(elementEndpoint, { method: 'DELETE' });
          }
        })
      );

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Failed to delete equipment:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Equipment</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {nodeIds.length} equipment item{nodeIds.length > 1 ? 's' : ''}? 
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" disabled={isDeleting} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            variant="destructive"
          >
            {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
