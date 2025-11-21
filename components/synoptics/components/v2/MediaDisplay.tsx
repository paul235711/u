'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, FileText, Loader2 } from 'lucide-react';

interface MediaDisplayProps {
  elementId: string;
  elementType: string;
  allowDelete?: boolean;
}

interface MediaItem {
  id: string;
  fileName: string;
  mimeType: string;
  storagePath: string;
  label?: string;
  createdAt: string;
}

export function MediaDisplay({ elementId, elementType, allowDelete }: MediaDisplayProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const queryClient = useQueryClient();

  const { data: media = [], isLoading, error } = useQuery({
    queryKey: ['media', elementId, elementType],
    queryFn: async () => {
      const response = await fetch(`/api/synoptics/media?elementId=${elementId}&elementType=${elementType}`);
      if (!response.ok) {
        console.error('Failed to fetch media:', response.status, response.statusText);
        return [];
      }
      const data = await response.json();
      return data as MediaItem[];
    },
    enabled: !!elementId && !!elementType,
  });

  const deleteMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete media');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', elementId, elementType] });
    },
  });

  const handleClick = () => {
    if (media.length > 0) {
      setCurrentImageIndex(0);
      setIsModalOpen(true);
    }
  };

  const handlePrevious = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1));
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0));
  };

  if (error) {
    return (
      <div className="w-full h-32 bg-gray-50 rounded-lg border flex items-center justify-center">
        <div className="text-sm text-red-600 text-center">
          Error loading media
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-32 bg-gray-50 rounded-lg border flex items-center justify-center cursor-not-allowed">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading media...
        </div>
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="w-full h-32 bg-gray-50 rounded-lg border flex items-center justify-center cursor-not-allowed">
        <div className="text-center text-gray-500">
          <FileText className="h-8 w-8 mx-auto mb-1 opacity-50" />
          <p className="text-xs">No media uploaded</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="w-full h-32 bg-gray-50 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={handleClick}
      >
        <div className="grid grid-cols-2 gap-1 h-full p-1">
          {media.slice(0, 4).map((item) => (
            <div key={item.id} className="relative bg-white rounded overflow-hidden">
              {item.mimeType.startsWith('image/') ? (
                <img
                  src={`/api/media/${item.id}`}
                  alt={item.fileName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Image failed to load:', item.storagePath);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <FileText className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>
          ))}
          {media.length > 4 && (
            <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
              +{media.length - 4}
            </div>
          )}
        </div>
      </div>

      {/* Full-size Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black">
          <DialogHeader className="sr-only">
            <DialogTitle>
              Media Viewer - {media[currentImageIndex]?.fileName || 'Image Viewer'}
            </DialogTitle>
          </DialogHeader>
          <div className="relative flex items-center justify-center min-h-[60vh]">
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Delete button */}
            {allowDelete && media[currentImageIndex] && (
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  try {
                    await deleteMutation.mutateAsync(media[currentImageIndex].id);
                    if (media.length <= 1) {
                      setIsModalOpen(false);
                    } else if (currentImageIndex >= media.length - 1) {
                      setCurrentImageIndex(currentImageIndex - 1);
                    }
                  } catch (err) {
                    console.error('Failed to delete media:', err);
                    alert('Échec de la suppression du média');
                  }
                }}
                className="absolute top-4 left-4 z-10"
              >
                Delete
              </Button>
            )}

            {/* Navigation buttons */}
            {media.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  className="absolute left-4 z-10 text-white hover:bg-white/20"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  className="absolute right-4 z-10 text-white hover:bg-white/20"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Current image */}
            {media[currentImageIndex] && (
              <div className="flex flex-col items-center">
                {media[currentImageIndex].mimeType.startsWith('image/') ? (
                  <img
                    src={`/api/media/${media[currentImageIndex].id}`}
                    alt={media[currentImageIndex].fileName}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center text-white">
                    <FileText className="h-16 w-16 mb-4" />
                    <p className="text-lg">{media[currentImageIndex].fileName}</p>
                  </div>
                )}

                {/* Image counter */}
                {media.length > 1 && (
                  <div className="mt-4 text-white text-sm">
                    {currentImageIndex + 1} / {media.length}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
