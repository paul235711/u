'use client';

import { cn } from '@/lib/utils';
import { Layers, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LayoutBadgeProps {
  count: number;
  onClick?: () => void;
  onAdd?: () => void;
  size?: 'sm' | 'md';
  isLoading?: boolean;
  showAddButton?: boolean;
}

/**
 * Badge component showing layout count for a location
 */
export function LayoutBadge({ count, onClick, onAdd, size = 'md', isLoading = false, showAddButton = false }: LayoutBadgeProps) {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
  };

  const buttonSizes = {
    sm: 'h-5 px-1.5',
    md: 'h-6 px-2',
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

  // Container with badge and optional add button
  return (
    <div className="inline-flex items-center gap-1">
      <button
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1 rounded-md font-medium transition-colors',
          onClick && count > 0 && 'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700',
          sizeClasses[size],
          count > 0 
            ? 'bg-blue-100 text-blue-700 border border-blue-300'
            : 'bg-gray-100 text-gray-400 border border-gray-300'
        )}
        title={`${count} layout${count !== 1 ? 's' : ''}`}
        aria-label={`${count} layout${count === 1 ? '' : 's'}`}
      >
        <Layers className={iconSizes[size]} />
        <span>{count}</span>
      </button>
      
      {showAddButton && onAdd && (
        <Button
          variant="ghost"
          size="sm"
          className={buttonSizes[size]}
          onClick={onAdd}
          title="Add layout"
        >
          <Plus className={iconSizes[size]} />
        </Button>
      )}
    </div>
  );
}
