'use client';

import { cn } from '@/lib/utils';
import type { ValveInfo } from './types';

interface ValveBadgeProps {
  locationId: string;
  count: number;
  onClick: () => void;
  size?: 'sm' | 'md';
  isLoading?: boolean;
}

/**
 * Badge component showing valve count for a location
 * Neutral call-to-action style for viewing valves
 */
export function ValveBadge({ locationId, count, onClick, size = 'md', isLoading = false }: ValveBadgeProps) {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
  };

  const iconSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1 rounded-md font-medium',
          sizeClasses[size],
          'bg-gray-100 text-gray-500 border border-gray-300'
        )}
      >
        <span className="text-xs">Loading...</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-medium transition-colors',
        'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700',
        sizeClasses[size],
        'bg-white text-gray-700 border border-gray-300'
      )}
      title={`${count} valve${count !== 1 ? 's' : ''} - Click to view`}
      aria-label={`${count} valve${count === 1 ? '' : 's'}`}
    >
      <span className={iconSizes[size]}>▶◀</span>
      <span>{count}</span>
    </button>
  );
}
