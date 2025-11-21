'use client';

interface EquipmentFooterProps {
  availableCount: number;
  onImportAll: () => void;
}

export function EquipmentFooter({ availableCount, onImportAll }: EquipmentFooterProps) {
  return (
    <div className="p-2 border-t bg-gray-50 flex items-center justify-between gap-2 text-xs">
      <p className="text-gray-500">
        {availableCount} disponible{availableCount !== 1 ? 's' : ''}
      </p>
      <button
        type="button"
        className="px-2 py-1 rounded border bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onImportAll}
        disabled={availableCount === 0}
      >
        Tout ajouter
      </button>
    </div>
  );
}
