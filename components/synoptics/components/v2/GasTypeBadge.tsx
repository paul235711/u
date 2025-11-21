import { Badge } from '@/components/ui/badge';
import type { GasType } from './hierarchy/gas-indicators';
import { getGasConfig } from './hierarchy/gas-config';

interface GasTypeBadgeProps {
  gasType: GasType | string;
}

export function GasTypeBadge({ gasType }: GasTypeBadgeProps) {
  const config = getGasConfig(gasType as string);
  const label = config.shortLabel;
  const colorClass = config.bgColor;
  const textColor = config.textColor;
  
  return (
    <div className={`inline-flex items-center justify-center rounded px-2 py-1 text-xs font-medium ${colorClass} ${textColor}`}>
      {label}
    </div>
  );
}
