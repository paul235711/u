'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Building2, MapPin, MoreVertical, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Site } from './use-sites-data';
import { cn } from '@/lib/utils';

interface SiteCardProps {
  site: Site;
  onUpdate: (siteId: string, data: Partial<Site>) => Promise<void>;
  onDelete: (siteId: string) => Promise<void>;
}

export function SiteCard({ site, onUpdate, onDelete }: SiteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(site.name);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save on name change with debounce
  useEffect(() => {
    if (!isEditing) return;
    if (editedName === site.name) return;
    if (!editedName.trim()) return;

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set saving status
    setSaveStatus('saving');

    // Debounce save
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        await onUpdate(site.id, { name: editedName });
        setSaveStatus('saved');
        
        // Clear saved status after 2 seconds
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      } catch (error) {
        console.error('Failed to save:', error);
        setSaveStatus('error');
        setEditedName(site.name); // Revert on error
      } finally {
        setIsSaving(false);
      }
    }, 1000); // 1 second debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editedName, isEditing, site.id, site.name, onUpdate]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedName(site.name);
    setIsEditing(false);
    setSaveStatus('idle');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await onDelete(site.id);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow group relative">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-lg font-semibold"
                  disabled={isSaving}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {saveStatus === 'saving' && (
                  <span className="text-gray-500 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-green-600 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Saved
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-red-600 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    Failed to save
                  </span>
                )}
              </div>
            </div>
          ) : (
            <Link href={`/synoptics/sites/${site.id}`} className="block">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 truncate">
                {site.name}
              </h3>
            </Link>
          )}
          
          {site.address && !isEditing && (
            <div className="mt-2 flex items-start text-sm text-gray-500">
              <MapPin className="mr-1 h-4 w-4 flex-shrink-0 mt-0.5" />
              <span className="truncate">{site.address}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          {!isEditing && (
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
                  <DropdownMenuItem onClick={handleStartEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Name
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Site
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {!isEditing && (
        <div className="mt-4 text-xs text-gray-400">
          Created {new Date(site.createdAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
