"use client";

import { memo, CSSProperties } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeLocationBadge } from '../NodeLocationBadge';
import { getGasLineColor } from '../hierarchy/gas-config';
import ValveIcon from '../../../icons/ValveIcon';

interface ValveNodeData {
  label: string;
  gasType: string;
  valveType?: 'isolation' | 'secondary' | 'control';
  state?: 'open' | 'closed';
  rotation?: number; // 0, 90, 180, 270
  scale?: number; // Visual hierarchy scaling
  editable?: boolean;
  isSelected?: boolean;
  isDownstream?: boolean;
  showLocationBadges?: boolean;
  siteId?: string;
  buildingName?: string;
  floorName?: string;
  zoneName?: string;
  isBuildingLevel?: boolean;
  isFloorLevel?: boolean;
}

export const ValveNodeEnhanced = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as ValveNodeData;
  const gasColor = getGasLineColor(nodeData.gasType);
  const showHandles = nodeData.editable !== false;
  const isSelected = nodeData.isSelected === true;
  const isDownstream = nodeData.isDownstream === true;
  const rotation = nodeData.rotation || 0;
  const scale = nodeData.scale || 1.0;
  const showLocationBadge = nodeData.showLocationBadges && nodeData.siteId;
  const isOpen = nodeData.state !== 'closed';
  const isBuildingLevel = nodeData.isBuildingLevel || false;
  const isFloorLevel = nodeData.isFloorLevel || false;
  
  // Handle positions with proper alignment
  const getHandlePositions = () => {
    switch (rotation) {
      case 90:
        return { 
          target: { position: Position.Top, style: { top: -2 } },
          source: { position: Position.Bottom, style: { bottom: -2 } }
        };
      case 180:
        return { 
          target: { position: Position.Right, style: { right: -2 } },
          source: { position: Position.Left, style: { left: -2 } }
        };
      case 270:
        return { 
          target: { position: Position.Bottom, style: { bottom: -2 } },
          source: { position: Position.Top, style: { top: -2 } }
        };
      default:
        return { 
          target: { position: Position.Left, style: { left: -2 } },
          source: { position: Position.Right, style: { right: -2 } }
        };
    }
  };
  
  const handles = getHandlePositions();
  
  // Highlight and hierarchy classes
  let highlightClass = 'shadow-md transition-all duration-200';
  if (isSelected) {
    highlightClass = 'ring-2 ring-blue-500 ring-offset-1 shadow-lg scale-110';
  } else if (isDownstream) {
    highlightClass = 'ring-1 ring-gray-400 shadow-md scale-105';
  } else if (isBuildingLevel) {
    highlightClass = 'shadow-lg ring-2 ring-gray-300';
  } else if (isFloorLevel) {
    highlightClass = 'shadow-md';
  }
  
  // Fixed visual width so all valves have the same length
  const minWidth = 56; // px, independent of label or hierarchy
  
  return (
    <div className="relative inline-block">
      <div 
        className={`px-2 py-1 rounded-md border-2 ${highlightClass} bg-white`}
        style={{ 
          minWidth: `${minWidth}px`,
          borderColor: gasColor,
          // Keep rotation but avoid scale here so all nodes have same length
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'center center',
          borderWidth: isBuildingLevel ? '3px' : '2px',
        }}
      >
        {/* Connection handles - smaller and cleaner */}
        <Handle 
          type="target" 
          position={handles.target.position} 
          className="w-2 h-2"
          style={{
            ...handles.target.style,
            background: gasColor,
            border: '1px solid white',
            opacity: showHandles ? 0.9 : 0,
          }}
        />
        <Handle 
          type="source" 
          position={handles.source.position}
          className="w-2 h-2"
          style={{
            ...handles.source.style,
            background: gasColor,
            border: '1px solid white',
            opacity: showHandles ? 0.9 : 0,
          }}
        />
        
        <div 
          className="flex items-center justify-center text-white px-1 py-0.5 rounded"
          style={{ 
            backgroundColor: gasColor,
          }}
        >
          <ValveIcon className="w-4 h-4 text-white" />
        </div>
        
        {/* Compact state indicator */}
        {nodeData.valveType === 'isolation' && (
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
            <div className={`text-[9px] font-medium px-1 rounded ${isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {isOpen ? 'O' : 'C'}
            </div>
          </div>
        )}
      </div>

      {/* Location badge */}
      {showLocationBadge && (
        <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10 whitespace-nowrap">
          <NodeLocationBadge node={data} siteId={nodeData.siteId!} />
        </div>
      )}
      
      {/* Zone label if in auto-layout - positioned to avoid state indicator */}
      {nodeData.zoneName && (
        <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[9px] text-gray-500 whitespace-nowrap">
          {nodeData.zoneName}
        </div>
      )}
    </div>
  );
});

ValveNodeEnhanced.displayName = 'ValveNodeEnhanced';
