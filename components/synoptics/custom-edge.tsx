'use client';

import { BaseEdge, EdgeProps, getSmoothStepPath } from '@xyflow/react';

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      {/* Main edge line */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={style}
        markerEnd={markerEnd}
      />
      {/* White outline for better visibility at crossings */}
      <path
        d={edgePath}
        fill="none"
        stroke="white"
        strokeWidth={(style.strokeWidth as number || 3) + 4}
        strokeOpacity={0.85}
        style={{ pointerEvents: 'none' }}
      />
      <path
        d={edgePath}
        fill="none"
        stroke={style.stroke as string || '#000'}
        strokeWidth={style.strokeWidth as number || 3}
        style={{ pointerEvents: 'visibleStroke' }}
      />
    </>
  );
}
