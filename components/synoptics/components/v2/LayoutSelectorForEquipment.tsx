'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Layout } from 'lucide-react';

interface LayoutSelectorForEquipmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: string;
  layouts: any[];
  onSuccess: () => void;
}

export function LayoutSelectorForEquipment({
  open,
  onOpenChange,
  nodeId,
  layouts,
  onSuccess
}: LayoutSelectorForEquipmentProps) {
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLayoutId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Create node position for this layout
      const response = await fetch('/api/synoptics/node-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId,
          layoutId: selectedLayoutId,
          x: 100, // Default position, will be moved on canvas
          y: 100,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add equipment to layout');
      }

      onSuccess();
      onOpenChange(false);
      setSelectedLayoutId('');
    } catch (error: any) {
      console.error('Error adding equipment to layout:', error);
      setError(error.message || 'Failed to add equipment to layout');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter à un Layout</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            {layouts.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                Aucun layout disponible. Créez d'abord un layout depuis la vue Hiérarchie.
              </div>
            ) : (
              <div>
                <Label>Sélectionner un Layout</Label>
                <RadioGroup
                  value={selectedLayoutId}
                  onValueChange={setSelectedLayoutId}
                  className="mt-2 space-y-2"
                >
                  {layouts.map((layout: any) => (
                    <div key={layout.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={layout.id} id={layout.id} />
                      <Label
                        htmlFor={layout.id}
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <Layout className="h-4 w-4 text-gray-400" />
                        <span>{layout.name}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedLayoutId || layouts.length === 0}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Ajouter au Layout
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
