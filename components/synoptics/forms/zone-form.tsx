'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { parseApiError, validateName } from '../shared/form-utils';
import { useToast, ToastContainer } from '../shared/use-toast';
import { useI18n } from '@/app/i18n-provider';

interface ZoneFormProps {
  floorId: string;
  siteId: string;
  initialData?: {
    name: string;
  };
  zoneId?: string;
}

export function ZoneForm({ floorId, siteId, initialData, zoneId }: ZoneFormProps) {
  const router = useRouter();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { toasts, showToast, removeToast } = useToast();

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    // Client-side validation
    const errors: Record<string, string> = {};

    const nameError = validateName(formData.name, t('synoptics.zoneForm.name.label'));
    if (nameError) errors.name = nameError;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      const url = zoneId
        ? `/api/synoptics/zones/${zoneId}`
        : '/api/synoptics/zones';

      const method = zoneId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          floorId,
          name: formData.name,
        }),
      });

      if (!response.ok) {
        const errorMessage = await parseApiError(response);
        throw new Error(errorMessage);
      }

      // Invalidate hierarchy cache so the site detail page refetches
      queryClient.invalidateQueries({ queryKey: ['site-hierarchy', siteId] });

      // Show success message
      showToast(
        zoneId
          ? t('synoptics.zoneForm.toast.updateSuccess')
          : t('synoptics.zoneForm.toast.createSuccess'),
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
          <Label htmlFor="name">{t('synoptics.zoneForm.name.label')}</Label>
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
            placeholder={t('synoptics.zoneForm.name.placeholder')}
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
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting
              ? t('synoptics.zoneForm.submit.saving')
              : zoneId
                ? t('synoptics.zoneForm.submit.update')
                : t('synoptics.zoneForm.submit.create')}
          </Button>
        </div>
      </form>
    </>
  );
}
