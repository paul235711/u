'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPicker } from '@/components/mapbox/map-picker';
import { Loader2 } from 'lucide-react';
import { parseApiError, validateName, validateLatitude, validateLongitude } from '../shared/form-utils';
import { useToast, ToastContainer } from '../shared/use-toast';

interface BuildingFormProps {
  siteId: string;
  initialData?: {
    name: string;
    latitude?: string;
    longitude?: string;
  };
  buildingId?: string;
  siteLat?: number;
  siteLng?: number;
}

export function BuildingForm({ siteId, initialData, buildingId, siteLat, siteLng }: BuildingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { toasts, showToast, removeToast } = useToast();

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    latitude: initialData?.latitude || '',
    longitude: initialData?.longitude || '',
  });

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString(),
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    // Client-side validation
    const errors: Record<string, string> = {};
    
    const nameError = validateName(formData.name, 'Building name');
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
      const url = buildingId
        ? `/api/synoptics/buildings/${buildingId}`
        : '/api/synoptics/buildings';
      
      const method = buildingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          siteId,
        }),
      });

      if (!response.ok) {
        const errorMessage = await parseApiError(response);
        throw new Error(errorMessage);
      }

      // Show success message
      showToast(
        buildingId ? 'Building updated successfully' : 'Building created successfully',
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
        <Label htmlFor="name">Building Name *</Label>
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
          placeholder="e.g., Main Building, East Wing"
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
        <Label>Location</Label>
        <p className="text-xs text-gray-500 mt-1 mb-2">
          Click on the map to set the building location
        </p>
        <div className="mt-1">
          <MapPicker
            onLocationSelect={handleLocationSelect}
            initialLat={formData.latitude ? parseFloat(formData.latitude) : undefined}
            initialLng={formData.longitude ? parseFloat(formData.longitude) : undefined}
            centerLat={siteLat}
            centerLng={siteLng}
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
          {isSubmitting ? 'Saving...' : buildingId ? 'Update Building' : 'Create Building'}
        </Button>
      </div>
    </form>
    </>
  );
}
