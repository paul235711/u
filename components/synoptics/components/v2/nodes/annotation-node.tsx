'use client';

import { memo, useState, useCallback } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { Building2 } from 'lucide-react';

export const AnnotationNode = memo(({ data, selected }: NodeProps) => {
  const { type, title, color, width, height, onUpdate, editable } = data as {
    type: 'building' | 'floor' | 'zone' | 'service';
    title: string;
    color?: string;
    width?: number;
    height?: number;
    onUpdate?: (updates: { size?: { width: number; height: number } }) => void;
    editable?: boolean;
  };

  const [isResizing, setIsResizing] = useState(false);

  const handleResizeEnd = useCallback((event: any, params: any) => {
    if (onUpdate && type === 'zone') {
      onUpdate({
        size: {
          width: params.width,
          height: params.height,
        },
      });
    }
    setIsResizing(false);
  }, [onUpdate, type]);

  // Zone - Rectangle avec resize
  if (type === 'zone') {
    return (
      <>
        {selected && (
          <NodeResizer
            minWidth={200}
            minHeight={150}
            onResizeStart={() => setIsResizing(true)}
            onResizeEnd={handleResizeEnd}
            color="#3b82f6"
            isVisible={selected}
          />
        )}
        <div
          style={{
            position: 'relative',
            width: width || 300,
            height: height || 200,
          }}
        >
          {/* Rectangle de zone (arrière-plan) */}
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: color || '#e5e7eb',
              opacity: 0.3,
              border: `2px dashed ${selected ? '#3b82f6' : '#9ca3af'}`,
              borderRadius: 8,
              cursor: isResizing ? 'nwse-resize' : (editable ? 'move' : 'default'),
              boxShadow: selected ? '0 0 0 3px rgba(59, 130, 246, 0.3)' : 'none',
            }}
          />
          
          {/* Texte de la zone (premier plan) */}
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontSize: 16,
              fontWeight: 600,
              color: '#374151',
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            {title}
          </div>
        </div>
      </>
    );
  }

  // Building - Header bar spanning the building column
  if (type === 'building') {
    return (
      <div
        style={{
          width: width || 320,
          height: height || 44,
          borderRadius: 9999,
          background: 'linear-gradient(90deg, #111827, #111827)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '0 14px',
          boxShadow: selected
            ? '0 0 0 2px rgba(59, 130, 246, 0.45)'
            : '0 4px 10px rgba(15, 23, 42, 0.25)',
          border: selected ? '1px solid #3b82f6' : '1px solid rgba(148, 163, 184, 0.35)',
          cursor: editable ? 'move' : 'default',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            borderRadius: 9999,
            backgroundColor: '#020617',
            border: '1px solid rgba(148, 163, 184, 0.5)',
          }}
        >
          <Building2 size={16} color="#e5e7eb" />
        </div>
        <span
          style={{
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: 0.04,
            textTransform: 'uppercase',
            color: '#f9fafb',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </span>
      </div>
    );
  }

  // Floor - Titre avec fond
  if (type === 'floor') {
    return (
      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: '#374151',
          backgroundColor: '#f3f4f6',
          border: selected ? '2px solid #3b82f6' : '1px solid #d1d5db',
          padding: '4px 8px',
          borderRadius: 4,
          cursor: editable ? 'move' : 'default',
          display: 'inline-block',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </div>
    );
  }

  // Service - Petit label
  return (
    <div
      style={{
        fontSize: 14,
        fontWeight: 500,
        color: '#374151',
        backgroundColor: '#ffffff',
        border: selected ? '2px solid #3b82f6' : '1px solid #d1d5db',
        padding: '4px 8px',
        borderRadius: 4,
        cursor: editable ? 'move' : 'default',
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
    >
      {title}
    </div>
  );
});

AnnotationNode.displayName = 'AnnotationNode';
