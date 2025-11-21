/**
 * Layout Editor Dialogs - V2
 * Manages all dialog components (QuickAdd, Delete Confirm, etc.)
 */

'use client';

import { ConfirmationDialog } from '@/components/synoptics/shared/confirmation-dialog';
import { useUIStore } from '../../stores/ui-store';
import { EquipmentWizardDialog } from './equipment-wizard/EquipmentWizardDialog';

interface LayoutEditorDialogsProps {
  layout: any;
  layoutId: string;
  organizationId: string;
}

export function LayoutEditorDialogs({
  layout,
  layoutId,
  organizationId,
}: LayoutEditorDialogsProps) {
  const showQuickAdd = useUIStore((state) => state.dialogs.quickAdd);
  const showDeleteConfirm = useUIStore((state) => state.dialogs.deleteConfirm);
  const setDialog = useUIStore((state) => state.setDialog);
  const selectedElementId = useUIStore((state) => state.selectedElementId);

  // Get selected element
  const selectedElement = layout.nodes?.find((n: any) => n.id === selectedElementId);

  return (
    <>
      {/* Quick Add - now uses unified EquipmentWizardDialog in create mode */}
      {showQuickAdd && (
        <EquipmentWizardDialog
          open={showQuickAdd}
          mode="create"
          siteId={layout.siteId}
          onOpenChange={(open) => setDialog('quickAdd', open)}
          onCompleted={() => {
            setDialog('quickAdd', false);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && selectedElement && (
        <ConfirmationDialog
          open={showDeleteConfirm}
          onOpenChange={(open) => setDialog('deleteConfirm', open)}
          onConfirm={async () => {
            // Delete handled by ElementPropertiesPanel
            setDialog('deleteConfirm', false);
          }}
          title={`Delete ${selectedElement.name}?`}
          description={`Are you sure you want to delete "${selectedElement.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      )}
    </>
  );
}
