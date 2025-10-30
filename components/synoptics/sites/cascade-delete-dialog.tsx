'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Building2, Layers, Box, Network, Loader2 } from 'lucide-react';
import type { CascadeDependencies } from './use-sites-data';

interface CascadeDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteName: string;
  siteId: string;
  onConfirm: () => Promise<void>;
  onCheckDependencies: (siteId: string) => Promise<CascadeDependencies>;
}

export function CascadeDeleteDialog({
  open,
  onOpenChange,
  siteName,
  siteId,
  onConfirm,
  onCheckDependencies,
}: CascadeDeleteDialogProps) {
  const [dependencies, setDependencies] = useState<CascadeDependencies | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (open && siteId) {
      loadDependencies();
    } else {
      // Reset state when dialog closes
      setDependencies(null);
      setLoading(true);
      setConfirmText('');
    }
  }, [open, siteId]);

  const loadDependencies = async () => {
    setLoading(true);
    try {
      const deps = await onCheckDependencies(siteId);
      setDependencies(deps);
    } catch (error) {
      console.error('Failed to load dependencies:', error);
      setDependencies({
        buildings: 0,
        floors: 0,
        layouts: 0,
        nodes: 0,
        totalItems: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (confirmText !== siteName) return;

    setDeleting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setDeleting(false);
    }
  };

  const isConfirmValid = confirmText === siteName;
  const hasDependencies = dependencies && dependencies.totalItems > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>Delete Site</DialogTitle>
              <DialogDescription className="mt-1">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Checking dependencies...</span>
            </div>
          ) : (
            <>
              {hasDependencies && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900">
                        Warning: Cascade Deletion
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        Deleting this site will also permanently delete:
                      </p>
                      <ul className="mt-3 space-y-2 text-sm text-amber-800">
                        {dependencies.buildings > 0 && (
                          <li className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span className="font-medium">{dependencies.buildings}</span>
                            <span>building{dependencies.buildings !== 1 ? 's' : ''}</span>
                          </li>
                        )}
                        {dependencies.floors > 0 && (
                          <li className="flex items-center gap-2">
                            <Layers className="h-4 w-4" />
                            <span className="font-medium">{dependencies.floors}</span>
                            <span>floor{dependencies.floors !== 1 ? 's' : ''}</span>
                          </li>
                        )}
                        {dependencies.layouts > 0 && (
                          <li className="flex items-center gap-2">
                            <Box className="h-4 w-4" />
                            <span className="font-medium">{dependencies.layouts}</span>
                            <span>layout{dependencies.layouts !== 1 ? 's' : ''}</span>
                          </li>
                        )}
                        {dependencies.nodes > 0 && (
                          <li className="flex items-center gap-2">
                            <Network className="h-4 w-4" />
                            <span className="font-medium">{dependencies.nodes}</span>
                            <span>equipment node{dependencies.nodes !== 1 ? 's' : ''}</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-700 mb-3">
                  You are about to delete <span className="font-semibold">{siteName}</span>.
                  {hasDependencies && ' All associated data will be permanently removed.'}
                </p>
                
                <Label htmlFor="confirm-name" className="text-sm font-medium">
                  Type <span className="font-mono font-semibold">{siteName}</span> to confirm:
                </Label>
                <Input
                  id="confirm-name"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={siteName}
                  className="mt-2"
                  autoComplete="off"
                  disabled={deleting}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmValid || deleting || loading}
          >
            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {deleting ? 'Deleting...' : 'Delete Site'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
