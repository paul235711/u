'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Layers, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LayoutSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layouts: any[];
  locationId: string;
  locationType: 'site' | 'floor';
}

/**
 * Dialog to select which layout to open
 */
export function LayoutSelectorDialog({ 
  open, 
  onOpenChange, 
  layouts,
  locationId,
  locationType
}: LayoutSelectorDialogProps) {
  const router = useRouter();

  // Filter layouts for this location
  const filteredLayouts = layouts.filter(layout => {
    if (locationType === 'site') {
      return !layout.floorId; // Site-level layouts have no floorId
    } else {
      return layout.floorId === locationId; // Floor-level layouts
    }
  });

  const handleOpenLayout = (layoutId: string) => {
    router.push(`/synoptics/layouts/${layoutId}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Select Layout {locationType === 'site' ? 'for Site' : 'for Floor'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-2 py-4">
          {filteredLayouts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No layouts available
            </p>
          ) : (
            filteredLayouts.map((layout) => (
              <button
                key={layout.id}
                onClick={() => handleOpenLayout(layout.id)}
                className="w-full flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded">
                    <Layers className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">{layout.name}</h4>
                    <p className="text-sm text-gray-500">
                      {layout.layoutType === 'site' ? 'Site Layout' : 'Floor Layout'}
                    </p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
