'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload } from 'lucide-react';
import { MapPicker } from '@/components/mapbox/map-picker';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MediaDisplay } from './MediaDisplay';

interface EquipmentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: any;
  onSuccess: () => void;
  siteLatitude?: number;
  siteLongitude?: number;
}

function extractCoordinate(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value.toString() : '';
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed.toString() : '';
  }
  return '';
}

export function EquipmentEditDialog({
  open,
  onOpenChange,
  node,
  onSuccess,
  siteLatitude,
  siteLongitude,
}: EquipmentEditDialogProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationExpanded, setLocationExpanded] = useState(false);
  const initialCoordsRef = useRef({ lat: '', lng: '' });

  const nodeTypeLabel = node?.nodeType
    ? node.nodeType.charAt(0).toUpperCase() + node.nodeType.slice(1)
    : 'Equipment';
  const isLocationDirty =
    latitude !== initialCoordsRef.current.lat || longitude !== initialCoordsRef.current.lng;

  useEffect(() => {
    if (node?.name) {
      setName(node.name);
    } else {
      setName('');
    }

    const latValue = extractCoordinate(node?.latitude ?? node?.location?.latitude);
    const lngValue = extractCoordinate(node?.longitude ?? node?.location?.longitude);
    setLatitude(latValue);
    setLongitude(lngValue);
    initialCoordsRef.current = { lat: latValue, lng: lngValue };
    setSelectedFiles(null);
    setLocationExpanded(false);
  }, [node]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
  };

  const handleLocationReset = () => {
    setLatitude(initialCoordsRef.current.lat);
    setLongitude(initialCoordsRef.current.lng);
  };

  const handleClearFiles = () => {
    setSelectedFiles(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !node) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // First, update the equipment name
      let endpoint = '';
      if (node.nodeType === 'valve') endpoint = `/api/synoptics/valves/${node.elementId}`;
      else if (node.nodeType === 'source') endpoint = `/api/synoptics/sources/${node.elementId}`;
      else if (node.nodeType === 'fitting') endpoint = `/api/synoptics/fittings/${node.elementId}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to update equipment');
      }

      // Then, update node coordinates if they changed
      if (isLocationDirty) {
        const nodeEndpoint = `/api/synoptics/nodes/${node.id}`;
        const nodeUpdateData: any = {};
        if (latitude) nodeUpdateData.latitude = parseFloat(latitude);
        if (longitude) nodeUpdateData.longitude = parseFloat(longitude);

        const nodeResponse = await fetch(nodeEndpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nodeUpdateData),
        });

        if (!nodeResponse.ok) {
          throw new Error('Failed to update node coordinates');
        }
      }

      // Then, upload files if any are selected
      if (selectedFiles && selectedFiles.length > 0) {
        const mediaEndpoint = `/api/synoptics/${node.nodeType}s/${node.elementId}/media`;
        
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const formData = new FormData();
          formData.append('file', file);
          formData.append('elementType', node.nodeType);
          
          const mediaResponse = await fetch(mediaEndpoint, {
            method: 'POST',
            body: formData,
          });
          
          if (!mediaResponse.ok) {
            throw new Error(`Failed to upload ${file.name}`);
          }
        }
      }

      setName('');
      setSelectedFiles(null);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DialogTitle>Edit {nodeTypeLabel}</DialogTitle>
            {node?.nodeType && <Badge variant="secondary">{nodeTypeLabel}</Badge>}
          </div>
          <DialogDescription>
            Update the basic information, location, and supporting media for this item. Changes apply immediately after saving.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <ScrollArea className="flex-1 px-1">
            <div className="space-y-4 py-4 pr-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="name">Name</Label>
                <span className="text-xs text-gray-500">Required</span>
              </div>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`e.g. ${nodeTypeLabel} A-12`}
                disabled={isSubmitting}
                autoFocus
              />
              <p className="text-xs text-gray-500">This label appears in the hierarchy, canvas, and maps.</p>
            </div>

            <div className="space-y-3 rounded-md border border-gray-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Label>Location (optional)</Label>
                  <p className="mt-1 text-xs text-gray-500">
                    {locationExpanded
                      ? 'Tap anywhere on the map to update the equipment position. Coordinates will be saved and displayed on site maps.'
                      : 'Provide map coordinates if you want to reference this equipment on site maps.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {locationExpanded && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleLocationReset}
                      disabled={!isLocationDirty || isSubmitting}
                    >
                      Reset to original
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLocationExpanded((prev) => !prev)}
                    disabled={isSubmitting}
                  >
                    {locationExpanded ? 'Hide map picker' : 'Set location'}
                  </Button>
                </div>
              </div>

              {locationExpanded && (
                <>
                  <div className="rounded-md border border-gray-100 h-[300px]">
                    <MapPicker
                      onLocationSelect={handleLocationSelect}
                      initialLat={latitude ? parseFloat(latitude) : undefined}
                      initialLng={longitude ? parseFloat(longitude) : undefined}
                      centerLat={
                        latitude ? parseFloat(latitude) : siteLatitude ?? undefined
                      }
                      centerLng={
                        longitude ? parseFloat(longitude) : siteLongitude ?? undefined
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        value={latitude}
                        readOnly
                        className="mt-1 bg-gray-50 text-gray-700"
                      />
                    </div>
                    <div>
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        value={longitude}
                        readOnly
                        className="mt-1 bg-gray-50 text-gray-700"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div>
              <Label htmlFor="files">Upload Media (Photos/Documents)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="files"
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <Upload className="h-4 w-4 text-gray-400" />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Upload reference images or documents that help identify this equipment.
              </p>
              {selectedFiles && selectedFiles.length > 0 && (
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>{selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected</span>
                    <Button type="button" variant="ghost" size="sm" onClick={handleClearFiles} disabled={isSubmitting}>
                      Clear
                    </Button>
                  </div>
                  <ul className="list-inside list-disc">
                    {Array.from(selectedFiles).map((file) => (
                      <li key={file.name}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Display existing media */}
            {node && (
              <MediaDisplay
                elementId={node.elementId}
                elementType={node.nodeType}
              />
            )}
            </div>
          </ScrollArea>
          
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
