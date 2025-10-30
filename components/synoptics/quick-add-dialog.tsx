'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GasTypeSelector } from './shared/gas-type-selector';

interface QuickAddDialogProps {
  open: boolean;
  elementType: 'source' | 'valve' | 'fitting';
  position: { x: number; y: number };
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function QuickAddDialog({
  open,
  elementType,
  position,
  onSubmit,
  onCancel,
}: QuickAddDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    gasType: 'oxygen',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSubmit({ ...formData, position });
      setFormData({ name: '', gasType: 'oxygen' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add element');
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (elementType) {
      case 'source':
        return 'Add Gas Source';
      case 'valve':
        return 'Add Valve';
      case 'fitting':
        return 'Add Fitting';
    }
  };

  const getPlaceholder = () => {
    switch (elementType) {
      case 'source':
        return 'e.g., Main O2 Supply';
      case 'valve':
        return 'e.g., Zone 1 Valve';
      case 'fitting':
        return 'e.g., Junction A';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            Configure the {elementType} properties
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm" role="alert">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="quick-name">Name *</Label>
            <Input
              id="quick-name"
              required
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (error) setError(null);
              }}
              placeholder={getPlaceholder()}
              className="mt-1"
              autoFocus
              aria-invalid={!!error}
            />
          </div>

          <GasTypeSelector
            value={formData.gasType}
            onChange={(value) => setFormData({ ...formData, gasType: value })}
            idPrefix="quick"
            required
          />

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Adding...' : 'Add Element'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
