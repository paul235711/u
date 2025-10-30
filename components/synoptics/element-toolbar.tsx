'use client';

import { useState } from 'react';
import { Cylinder, Gauge, Circle } from 'lucide-react';

interface ElementToolbarProps {
  onDragStart: (elementType: 'source' | 'valve' | 'fitting') => void;
}

export function ElementToolbar({ onDragStart }: ElementToolbarProps) {
  const [dragging, setDragging] = useState<string | null>(null);

  const handleDragStart = (elementType: 'source' | 'valve' | 'fitting') => (e: React.DragEvent) => {
    e.dataTransfer.setData('elementType', elementType);
    e.dataTransfer.effectAllowed = 'copy';
    // Set a custom drag image (optional)
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.8';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 25, 25);
    setTimeout(() => document.body.removeChild(dragImage), 0);
    
    setDragging(elementType);
    onDragStart(elementType);
  };

  const handleDragEnd = () => {
    setDragging(null);
  };

  return (
    <div className="bg-white border-b border-gray-200 p-3" role="toolbar" aria-label="Element toolbar">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 mr-2">
          Drag to add:
        </span>
        
        {/* Source */}
        <div
          draggable
          onDragStart={handleDragStart('source')}
          onDragEnd={handleDragEnd}
          className={`flex items-center gap-2 px-3 py-2 bg-blue-50 border-2 rounded-lg cursor-move hover:bg-blue-100 transition-all ${
            dragging === 'source' ? 'border-blue-500 shadow-lg scale-105' : 'border-blue-300'
          }`}
          title="Drag to add gas source"
          role="button"
          aria-label="Drag to add gas source"
          tabIndex={0}
        >
          <Cylinder className="w-4 h-4 text-blue-600" aria-hidden="true" />
          <span className="text-sm font-medium text-blue-900">Source</span>
        </div>

        {/* Valve */}
        <div
          draggable
          onDragStart={handleDragStart('valve')}
          onDragEnd={handleDragEnd}
          className={`flex items-center gap-2 px-3 py-2 bg-red-50 border-2 rounded-lg cursor-move hover:bg-red-100 transition-all ${
            dragging === 'valve' ? 'border-red-500 shadow-lg scale-105' : 'border-red-300'
          }`}
          title="Drag to add valve"
          role="button"
          aria-label="Drag to add valve"
          tabIndex={0}
        >
          <Gauge className="w-4 h-4 text-red-600" aria-hidden="true" />
          <span className="text-sm font-medium text-red-900">Valve</span>
        </div>

        {/* Fitting */}
        <div
          draggable
          onDragStart={handleDragStart('fitting')}
          onDragEnd={handleDragEnd}
          className={`flex items-center gap-2 px-3 py-2 bg-green-50 border-2 rounded-lg cursor-move hover:bg-green-100 transition-all ${
            dragging === 'fitting' ? 'border-green-500 shadow-lg scale-105' : 'border-green-300'
          }`}
          title="Drag to add fitting"
          role="button"
          aria-label="Drag to add fitting"
          tabIndex={0}
        >
          <Circle className="w-4 h-4 text-green-600" aria-hidden="true" />
          <span className="text-sm font-medium text-green-900">Fitting</span>
        </div>

        <div className="ml-auto text-xs text-gray-500" aria-live="polite">
          💡 Drag elements onto the canvas
        </div>
      </div>
    </div>
  );
}
