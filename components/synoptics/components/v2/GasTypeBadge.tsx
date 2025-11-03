import { Badge } from '@/components/ui/badge';
import type { GasType } from './hierarchy/gas-indicators';

const GAS_LABELS: Record<GasType, string> = {
  oxygen: 'O₂',
  medical_air: 'Air',
  nitrous_oxide: 'N₂O',
  carbon_dioxide: 'CO₂',
  nitrogen: 'N₂',
  vacuum: 'Vac',
};

const GAS_COLORS: Record<GasType, string> = {
  oxygen: 'bg-red-500',
  medical_air: 'bg-yellow-500',
  nitrous_oxide: 'bg-blue-500',
  carbon_dioxide: 'bg-green-500',
  nitrogen: 'bg-gray-500',
  vacuum: 'bg-purple-500',
};

interface GasTypeBadgeProps {
  gasType: GasType | string;
}

export function GasTypeBadge({ gasType }: GasTypeBadgeProps) {
  const label = GAS_LABELS[gasType as GasType] || gasType;
  const colorClass = GAS_COLORS[gasType as GasType] || 'bg-gray-500';
  
  return (
    <div className={`inline-flex items-center justify-center rounded px-2 py-1 text-xs font-medium text-white ${colorClass}`}>
      {label}
    </div>
  );
}
