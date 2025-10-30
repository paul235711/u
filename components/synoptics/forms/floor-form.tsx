'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { parseApiError, validateName, validateFloorNumber } from '../shared/form-utils';
import { useToast, ToastContainer } from '../shared/use-toast';

interface FloorFormProps {
  buildingId: string;
  siteId: string;
  initialData?: {
    floorNumber: number;
    name?: string;
  };
  floorId?: string;
}

export function FloorForm({ buildingId, siteId, initialData, floorId }: FloorFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { toasts, showToast, removeToast } = useToast();

  const [formData, setFormData] = useState({
    floorNumber: initialData?.floorNumber?.toString() || '',
    name: initialData?.name || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    // Client-side validation
    const errors: Record<string, string> = {};
    
    const floorError = validateFloorNumber(formData.floorNumber);
    if (floorError) errors.floorNumber = floorError;

    if (formData.name) {
      const nameError = validateName(formData.name, 'Floor name');
      if (nameError) errors.name = nameError;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      const url = floorId
        ? `/api/synoptics/floors/${floorId}`
        : '/api/synoptics/floors';
      
      const method = floorId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buildingId,
          floorNumber: parseInt(formData.floorNumber),
          name: formData.name || null,
        }),
      });

      if (!response.ok) {
        const errorMessage = await parseApiError(response);
        throw new Error(errorMessage);
      }

      // Show success message
      showToast(
        floorId ? 'Floor updated successfully' : 'Floor created successfully',
        'success'
      );

      // Delay redirect to show success message
      setTimeout(() => {
        router.push(`/synoptics/sites/${siteId}`);
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="floorNumber">Floor Number *</Label>
        <Input
          id="floorNumber"
          type="number"
          required
          min="-10"
          max="200"
          value={formData.floorNumber}
          onChange={(e) => {
            setFormData({ ...formData, floorNumber: e.target.value });
            if (fieldErrors.floorNumber) {
              setFieldErrors((prev) => ({ ...prev, floorNumber: '' }));
            }
          }}
          placeholder="e.g., 1, 2, -1 (basement)"
          className="mt-1"
          aria-invalid={!!fieldErrors.floorNumber}
          aria-describedby="floorNumber-help floorNumber-error"
        />
        <p id="floorNumber-help" className="text-xs text-gray-500 mt-1">
          Use negative numbers for basement levels (range: -10 to 200)
        </p>
        {fieldErrors.floorNumber && (
          <p id="floorNumber-error" className="text-xs text-red-600 mt-1" role="alert">
            {fieldErrors.floorNumber}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="name">Floor Name (Optional)</Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => {
            setFormData({ ...formData, name: e.target.value });
            if (fieldErrors.name) {
              setFieldErrors((prev) => ({ ...prev, name: '' }));
            }
          }}
          placeholder="e.g., Cardiology, Emergency"
          className="mt-1"
          aria-invalid={!!fieldErrors.name}
          aria-describedby={fieldErrors.name ? 'name-error' : undefined}
        />
        {fieldErrors.name && (
          <p id="name-error" className="text-xs text-red-600 mt-1" role="alert">
            {fieldErrors.name}
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Saving...' : floorId ? 'Update Floor' : 'Create Floor'}
        </Button>
      </div>
    </form>
    </>
  );
}
