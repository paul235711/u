'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { parseApiError, validateName } from '../shared/form-utils';
import { useToast, ToastContainer } from '../shared/use-toast';

interface LayoutFormProps {
  organizationId: string;
  siteId?: string;
  floorId?: string;
  initialData?: {
    name: string;
    layoutType: 'site' | 'floor';
  };
  layoutId?: string;
}

export function LayoutForm({ 
  organizationId, 
  siteId, 
  floorId, 
  initialData, 
  layoutId 
}: LayoutFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { toasts, showToast, removeToast } = useToast();
  const [floors, setFloors] = useState<any[]>([]);
  const [loadingFloors, setLoadingFloors] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    layoutType: initialData?.layoutType || 'site' as 'site' | 'floor',
    selectedFloorId: floorId || '',
  });

  // Load floors when site-specific layout is selected
  useEffect(() => {
    if (formData.layoutType === 'floor' && siteId) {
      setLoadingFloors(true);
      fetch(`/api/synoptics/sites/${siteId}/hierarchy`)
        .then(res => res.json())
        .then(data => {
          const allFloors = data.buildings?.flatMap((b: any) => 
            b.floors?.map((f: any) => ({
              id: f.id,
              name: f.name,
              buildingName: b.name,
            })) || []
          ) || [];
          setFloors(allFloors);
        })
        .catch(err => console.error('Failed to load floors:', err))
        .finally(() => setLoadingFloors(false));
    }
  }, [formData.layoutType, siteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    // Client-side validation
    const errors: Record<string, string> = {};
    
    const nameError = validateName(formData.name, 'Layout name');
    if (nameError) errors.name = nameError;

    if (formData.layoutType === 'floor' && !formData.selectedFloorId) {
      errors.floor = 'Please select a floor';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      const url = layoutId
        ? `/api/synoptics/layouts/${layoutId}`
        : '/api/synoptics/layouts';
      
      const method = layoutId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          layoutType: formData.layoutType,
          organizationId,
          siteId: siteId || null,
          floorId: formData.layoutType === 'floor' ? formData.selectedFloorId : null,
        }),
      });

      if (!response.ok) {
        const errorMessage = await parseApiError(response);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Show success message
      showToast(
        layoutId ? 'Layout updated successfully' : 'Layout created successfully',
        'success'
      );

      // Delay redirect to show success message
      setTimeout(() => {
        router.push(`/synoptics/layouts/${data.id}`);
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
        <Label htmlFor="name">Layout Name *</Label>
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
          placeholder="e.g., Main Gas Distribution, Floor 2 Network"
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
        <Label>Layout Type *</Label>
        <p className="text-xs text-gray-500 mt-1 mb-2">
          Choose where this layout will be displayed in your site hierarchy
        </p>
        <RadioGroup
          value={formData.layoutType}
          onValueChange={(value) => 
            setFormData({ ...formData, layoutType: value as 'site' | 'floor', selectedFloorId: '' })
          }
          className="mt-2 space-y-3"
          aria-label="Select layout type"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="site" id="site" />
            <Label htmlFor="site" className="font-normal cursor-pointer">
              <span className="font-medium">Site-level</span>
              <span className="text-sm text-gray-500 block">
                Overview of entire site gas distribution
              </span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="floor" id="floor" />
            <Label htmlFor="floor" className="font-normal cursor-pointer">
              <span className="font-medium">Floor-level</span>
              <span className="text-sm text-gray-500 block">
                Detailed view of a specific floor
              </span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Floor selector - only shown when floor layout type is selected */}
      {formData.layoutType === 'floor' && (
        <div>
          <Label htmlFor="floor-select">Select Floor *</Label>
          <Select
            value={formData.selectedFloorId}
            onValueChange={(value) => {
              setFormData({ ...formData, selectedFloorId: value });
              if (fieldErrors.floor) {
                setFieldErrors((prev) => ({ ...prev, floor: '' }));
              }
            }}
            disabled={loadingFloors}
          >
            <SelectTrigger className="mt-1" id="floor-select">
              <SelectValue placeholder={loadingFloors ? "Loading floors..." : "Select a floor"} />
            </SelectTrigger>
            <SelectContent>
              {floors.length === 0 ? (
                <div className="p-2 text-sm text-gray-500">
                  No floors available. Please create floors first.
                </div>
              ) : (
                floors.map((floor) => (
                  <SelectItem key={floor.id} value={floor.id}>
                    {floor.buildingName} - {floor.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {fieldErrors.floor && (
            <p className="text-xs text-red-600 mt-1" role="alert">
              {fieldErrors.floor}
            </p>
          )}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 After creating the layout, you'll be able to add network elements (sources, valves, fittings) 
          and position them on the canvas.
        </p>
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
          {isSubmitting ? 'Creating...' : layoutId ? 'Update Layout' : 'Create Layout'}
        </Button>
      </div>
    </form>
    </>
  );
}
