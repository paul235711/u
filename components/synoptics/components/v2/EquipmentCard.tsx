'use client';

import { Building2, MapPin, Layers } from 'lucide-react';
import ValveIcon from '../../icons/ValveIcon';
import { Cylinder } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getGasConfig } from './hierarchy/gas-config';

const STATUS_COLORS: Record<string, { badge: string; dot: string }> = {
  open: { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  closed: { badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
  maintenance: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  alarm: { badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  unknown: { badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
};

function getGasColor(gasType: string) {
  const config = getGasConfig(gasType);
  const borderClass = config.bgColor.replace('bg-', 'border-');
  return {
    bg: 'bg-white',
    border: borderClass,
    text: config.textColor,
    badge: config.bgColor,
  };
}

function formatGasType(gasType: string): string {
  const config = getGasConfig(gasType);
  return config.shortLabel || config.label || gasType;
}

function humanise(text: string) {
  return text?.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase()) || '';
}

interface EquipmentCardProps {
  id: string;
  name: string;
  nodeType: 'valve' | 'source' | 'fitting';
  gasType: string;
  status?: string;
  buildingName?: string;
  buildingImage?: string;
  floorName?: string;
  onClick?: () => void;
  variant?: 'default' | 'compact';
}

export function EquipmentCard({
  id,
  name,
  nodeType,
  gasType,
  status = 'unknown',
  buildingName,
  buildingImage,
  floorName,
  onClick,
  variant = 'default',
}: EquipmentCardProps) {
  const colors = getGasColor(gasType);
  const statusStyle = STATUS_COLORS[status] || STATUS_COLORS.unknown;
  
  // Generate equipment identifier (V01, S01, etc.)
  const typePrefix = nodeType === 'valve' ? 'V' : nodeType === 'source' ? 'S' : 'F';
  const identifier = `${typePrefix}${id.slice(0, 2).toUpperCase()}`;
  
  const Icon = nodeType === 'valve' ? ValveIcon : nodeType === 'source' ? Cylinder : Layers;
  
  if (variant === 'compact') {
    return (
      <button
        onClick={onClick}
        className={cn(
          'group relative w-full rounded-lg border-2 p-3 text-left transition-all hover:shadow-md',
          colors.bg,
          colors.border
        )}
      >
        <div className="flex items-start gap-3">
          {/* Icon & Identifier */}
          <div className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border-2',
            colors.border,
            'bg-white'
          )}>
            <Icon className={cn('h-5 w-5', colors.text)} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('text-sm font-bold', colors.text)}>
                {identifier}
              </span>
              <span className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white',
                colors.badge
              )}>
                {formatGasType(gasType)}
              </span>
            </div>
            
            <div className="text-xs font-medium text-gray-700 truncate">{name}</div>
            
            {/* Building info */}
            {buildingName && (
              <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-500">
                <Building2 className="h-3 w-3" />
                <span className="truncate">{buildingName}</span>
                {floorName && <span className="text-gray-400">· {floorName}</span>}
              </div>
            )}
            
            {/* Status */}
            {nodeType === 'valve' && (
              <div className="mt-1.5">
                <span className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                  statusStyle.badge
                )}>
                  <span className={cn('h-1 w-1 rounded-full', statusStyle.dot)} />
                  {humanise(status)}
                </span>
              </div>
            )}
          </div>
        </div>
      </button>
    );
  }
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative w-full overflow-hidden rounded-xl border-2 transition-all hover:shadow-lg',
        colors.bg,
        colors.border
      )}
    >
      {/* Building Image Header */}
      {buildingImage && (
        <div className="relative h-32 w-full overflow-hidden bg-gray-200">
          <img
            src={buildingImage}
            alt={buildingName || 'Building'}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          
          {/* Equipment Badge Overlay */}
          <div className="absolute left-3 top-3">
            <div className={cn(
              'flex items-center gap-2 rounded-lg border-2 bg-white px-3 py-1.5 shadow-lg',
              colors.border
            )}>
              <Icon className={cn('h-4 w-4', colors.text)} />
              <span className={cn('text-base font-bold', colors.text)}>
                {identifier}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Card Content */}
      <div className="p-4">
        {/* Equipment Info */}
        {!buildingImage && (
          <div className="mb-3 flex items-center gap-3">
            <div className={cn(
              'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border-2',
              colors.border,
              'bg-white'
            )}>
              <Icon className={cn('h-6 w-6', colors.text)} />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className={cn('text-lg font-bold', colors.text)}>
                  {identifier}
                </span>
                <span className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-white',
                  colors.badge
                )}>
                  {formatGasType(gasType)}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {buildingImage && (
          <div className="mb-2 flex items-center gap-2">
            <span className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white',
              colors.badge
            )}>
              {formatGasType(gasType)}
            </span>
          </div>
        )}
        
        <div className="mb-3">
          <div className="text-sm font-semibold text-gray-900">{name}</div>
        </div>
        
        {/* Building Location */}
        {buildingName && (
          <div className="mb-3 flex items-start gap-2 rounded-lg bg-white/50 p-2">
            <Building2 className={cn('mt-0.5 h-4 w-4 flex-shrink-0', colors.text)} />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-gray-900 truncate">{buildingName}</div>
              {floorName && (
                <div className="mt-0.5 text-xs text-gray-500">{floorName}</div>
              )}
            </div>
          </div>
        )}
        
        {/* Status Badge */}
        {nodeType === 'valve' && (
          <div className="flex items-center justify-between">
            <span className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
              statusStyle.badge
            )}>
              <span className={cn('h-1.5 w-1.5 rounded-full', statusStyle.dot)} />
              {humanise(status)}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
