'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AddressSearch } from '@/components/mapbox/address-search';
import { Loader2 } from 'lucide-react';
import { parseApiError, validateName, validateLatitude, validateLongitude } from '../shared/form-utils';
import { useToast, ToastContainer } from '../shared/use-toast';

interface SiteFormProps {
  organizationId: string;
  initialData?: {
    name: string;
    address?: string;
    latitude?: string;
    longitude?: string;
  };
  siteId?: string;
}

export function SiteForm({ organizationId, initialData, siteId }: SiteFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { toasts, showToast, removeToast } = useToast();

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    address: initialData?.address || '',
    latitude: initialData?.latitude || '',
    longitude: initialData?.longitude || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    // Client-side validation
    const errors: Record<string, string> = {};
    
    const nameError = validateName(formData.name, 'Site name');
    if (nameError) errors.name = nameError;

    if (formData.latitude) {
      const latError = validateLatitude(formData.latitude);
      if (latError) errors.latitude = latError;
    }

    if (formData.longitude) {
      const lngError = validateLongitude(formData.longitude);
      if (lngError) errors.longitude = lngError;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      const url = siteId
        ? `/api/synoptics/sites/${siteId}`
        : '/api/synoptics/sites';
      
      const method = siteId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          organizationId,
        }),
      });

      if (!response.ok) {
        const errorMessage = await parseApiError(response);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Show success message
      showToast(
        siteId ? 'Site updated successfully' : 'Site created successfully',
        'success'
      );

      // Delay redirect to show success message
      setTimeout(() => {
        router.push(`/synoptics/sites/${data.id}`);
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
        <Label htmlFor="name">Site Name *</Label>
        <Input
          id="name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => {
            setFormData({ ...formData, name: e.target.value });
            if (fieldErrors.name) {
              setFieldErrors((prev) => ({ ...prev, name: '' }));
            }
          }}
          placeholder="e.g., Central Hospital"
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

    <div>
      <Label>Address</Label>
      <p className="text-xs text-gray-500 mt-1 mb-2">
        Search for an address to auto-fill coordinates
      </p>
      <div className="mt-1">
        <AddressSearch
          onSelect={(result) => {
            setFormData({
              ...formData,
              address: result.address,
              latitude: result.latitude.toString(),
              longitude: result.longitude.toString(),
            });
          }}
          initialValue={formData.address}
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="latitude">Latitude (auto-filled)</Label>
        <Input
          id="latitude"
          type="text"
          value={formData.latitude}
          readOnly
          className="mt-1 bg-gray-50 cursor-not-allowed"
          aria-readonly="true"
        />
        {fieldErrors.latitude && (
          <p className="text-xs text-red-600 mt-1" role="alert">
            {fieldErrors.latitude}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="longitude">Longitude (auto-filled)</Label>
        <Input
          id="longitude"
          type="text"
          value={formData.longitude}
          readOnly
          className="mt-1 bg-gray-50 cursor-not-allowed"
          aria-readonly="true"
        />
        {fieldErrors.longitude && (
          <p className="text-xs text-red-600 mt-1" role="alert">
            {fieldErrors.longitude}
          </p>
        )}
      </div>
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
          {isSubmitting ? 'Saving...' : siteId ? 'Update Site' : 'Create Site'}
        </Button>
      </div>
    </form>
    </>
  );
}
