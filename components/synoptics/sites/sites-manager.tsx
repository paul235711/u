'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Loader2, AlertCircle } from 'lucide-react';
import { SiteCard } from './site-card';
import { CascadeDeleteDialog } from './cascade-delete-dialog';
import { useSitesData } from './use-sites-data';
import { useToast, ToastContainer } from '../shared/use-toast';
import { useI18n } from '@/app/i18n-provider';

interface SitesManagerProps {
  organizationId: string;
}

export function SitesManager({ organizationId }: SitesManagerProps) {
  const {
    sites,
    isLoading,
    error,
    updateSite,
    deleteSite,
    checkCascadeDependencies,
  } = useSitesData({ organizationId, autoRefresh: false });

  const { toasts, showToast, removeToast } = useToast();
  const { t } = useI18n();
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    site: { id: string; name: string } | null;
  }>({
    open: false,
    site: null,
  });

  const handleUpdate = async (siteId: string, data: any) => {
    try {
      await updateSite(siteId, data);
      // Success toast is handled by the autosave in SiteCard
    } catch (error) {
      showToast(t('synoptics.sites.toast.updateError'), 'error');
      throw error;
    }
  };

  const handleDeleteRequest = (siteId: string, siteName: string) => {
    setDeleteDialog({
      open: true,
      site: { id: siteId, name: siteName },
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.site) return;

    try {
      await deleteSite(deleteDialog.site.id);
      showToast(t('synoptics.sites.toast.deleteSuccess'), 'success');
      setDeleteDialog({ open: false, site: null });
    } catch (error) {
      showToast(t('synoptics.sites.toast.deleteError'), 'error');
      throw error;
    }
  };

  // Initial loading state
  if (isLoading) {
    return (
      <div className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-600">{t('synoptics.sites.loading')}</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('synoptics.sites.error.title')}
            </h3>
            <p className="text-sm text-gray-600 mb-6">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <div className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('synoptics.sites.title')}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {t('synoptics.sites.subtitle')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/synoptics/sites/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('synoptics.sites.new')}
                </Link>
              </Button>
            </div>
          </div>

          {sites.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                {t('synoptics.sites.empty.title')}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {t('synoptics.sites.empty.body')}
              </p>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/synoptics/sites/new">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('synoptics.sites.new')}
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sites.map((site) => (
                <SiteCard
                  key={site.id}
                  site={site}
                  onUpdate={handleUpdate}
                  onDelete={async (siteId) => {
                    handleDeleteRequest(siteId, site.name);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cascade Delete Dialog */}
      {deleteDialog.site && (
        <CascadeDeleteDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ open, site: null })}
          siteName={deleteDialog.site.name}
          siteId={deleteDialog.site.id}
          onConfirm={handleConfirmDelete}
          onCheckDependencies={checkCascadeDependencies}
        />
      )}
    </>
  );
}
