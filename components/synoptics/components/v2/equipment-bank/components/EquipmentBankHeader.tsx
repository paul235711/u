'use client';

import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface EquipmentBankHeaderProps {
  onClose: () => void;
}

export function EquipmentBankHeader({ onClose }: EquipmentBankHeaderProps) {
  return (
    <div className="p-3 border-b flex items-center justify-between bg-gray-50">
      <h3 className="font-semibold text-sm">Équipements</h3>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="h-7 w-7 p-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
