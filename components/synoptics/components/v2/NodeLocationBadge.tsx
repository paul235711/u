'use client';

import { memo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { EquipmentLocationBreadcrumb } from './EquipmentLocationBreadcrumb';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface NodeLocationBadgeProps {
  node: any;
  siteId: string;
}

export const NodeLocationBadge = memo(function NodeLocationBadge({ node, siteId }: NodeLocationBadgeProps) {
  if (!siteId) return null;

  return (
    <Card className="px-2 py-1 shadow-sm border border-gray-200/70 bg-white/70 backdrop-blur-sm max-w-[160px]">
      <NodeLocationBadgeInner node={node} siteId={siteId} />
    </Card>
  );
});

function NodeLocationBadgeInner({ node, siteId }: NodeLocationBadgeProps) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="flex items-center gap-1">
      <div className="flex-1 min-w-0 text-[10px] leading-tight text-gray-700">
        <EquipmentLocationBreadcrumb
          node={node}
          siteId={siteId}
          variant="compact"
          onlyLast={collapsed}
        />
      </div>
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        aria-label={collapsed ? 'Show full location path' : 'Show only last location'}
      >
        {collapsed ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronUp className="h-3 w-3" />
        )}
      </button>
    </div>
  );
}
