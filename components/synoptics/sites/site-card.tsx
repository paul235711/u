'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, MapPin, MoreVertical, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddressSearch } from '@/components/mapbox/address-search';
import { parseApiError, validateName, validateLatitude, validateLongitude } from '../shared/form-utils';
import type { Site } from './use-sites-data';
import { cn } from '@/lib/utils';
import { useI18n } from '@/app/i18n-provider';

interface SiteCardProps {
  site: Site;
  onUpdate: (siteId: string, data: Partial<Site>) => Promise<void>;
  onDelete: (siteId: string) => Promise<void>;
}

export function SiteCard({ site, onUpdate, onDelete }: SiteCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: site.name,
    address: site.address || '',
    latitude: site.latitude || '',
    longitude: site.longitude || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { t } = useI18n();

  // Sync edit form data when dialog opens
  useEffect(() => {
    if (isEditDialogOpen) {
      setEditFormData({
        name: site.name,
        address: site.address || '',
        latitude: site.latitude || '',
        longitude: site.longitude || '',
      });
      setFieldErrors({});
    }
  }, [isEditDialogOpen, site]);

  // Handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    // Client-side validation
    const errors: Record<string, string> = {};
    
    const nameError = validateName(editFormData.name, 'Site name');
    if (nameError) errors.name = nameError;

    if (editFormData.latitude) {
      const latError = validateLatitude(editFormData.latitude);
      if (latError) errors.latitude = latError;
    }

    if (editFormData.longitude) {
      const lngError = validateLongitude(editFormData.longitude);
      if (lngError) errors.longitude = lngError;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      await onUpdate(site.id, editFormData);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update site:', error);
      // Could add error display here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await onDelete(site.id);
  };

  return (
    <>
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow group relative">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <Link href={`/synoptics/sites/${site.id}`} className="block">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 truncate">
              {site.name}
            </h3>
          </Link>
          
          {site.address && (
            <div className="mt-2 flex items-start text-sm text-gray-500">
              <MapPin className="mr-1 h-4 w-4 flex-shrink-0 mt-0.5" />
              <span className="truncate">{site.address}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          <>
            <Building2 className="h-8 w-8 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t('synoptics.siteCard.menu.edit')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('synoptics.siteCard.menu.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-400">
        {t('synoptics.siteCard.footer.created')}{' '}
        {new Date(site.createdAt).toLocaleDateString()}
      </div>
    </div>

    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('synoptics.siteCard.editDialog.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">{t('synoptics.siteCard.editDialog.nameLabel')}</Label>
            <Input
              id="edit-name"
              type="text"
              required
              value={editFormData.name}
              onChange={(e) => {
                setEditFormData({ ...editFormData, name: e.target.value });
                if (fieldErrors.name) {
                  setFieldErrors((prev) => ({ ...prev, name: '' }));
                }
              }}
              className="mt-1"
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? 'edit-name-error' : undefined}
            />
            {fieldErrors.name && (
              <p id="edit-name-error" className="text-xs text-red-600 mt-1" role="alert">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <Label>{t('synoptics.siteCard.editDialog.addressLabel')}</Label>
            <p className="text-xs text-gray-500 mt-1 mb-2">
              {t('synoptics.siteCard.editDialog.addressHelp')}
            </p>
            <div className="mt-1">
              <AddressSearch
                onSelect={(result) => {
                  setEditFormData({
                    ...editFormData,
                    address: result.address,
                    latitude: result.latitude.toString(),
                    longitude: result.longitude.toString(),
                  });
                }}
                initialValue={editFormData.address}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-latitude">
                {t('synoptics.siteCard.editDialog.latitudeLabel')}
              </Label>
              <Input
                id="edit-latitude"
                type="text"
                value={editFormData.latitude}
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
              <Label htmlFor="edit-longitude">
                {t('synoptics.siteCard.editDialog.longitudeLabel')}
              </Label>
              <Input
                id="edit-longitude"
                type="text"
                value={editFormData.longitude}
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
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting
                ? t('synoptics.siteCard.editDialog.saving')
                : t('synoptics.siteCard.editDialog.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}