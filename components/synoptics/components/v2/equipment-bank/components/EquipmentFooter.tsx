'use client';

interface EquipmentFooterProps {
  availableCount: number;
}

export function EquipmentFooter({ availableCount }: EquipmentFooterProps) {
  return (
    <div className="p-2 border-t bg-gray-50 text-center">
      <p className="text-xs text-gray-500">
        {availableCount} disponible{availableCount !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
