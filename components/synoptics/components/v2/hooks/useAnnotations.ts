import { useState, useCallback, useEffect } from 'react';
import { Annotation } from '../AnnotationLayer';

/**
 * Hook to manage annotations state and persistence via API
 */
export function useAnnotations(layoutId: string, initialAnnotations: Annotation[] = []) {
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load annotations from API
  const loadAnnotations = useCallback(async () => {
    if (!layoutId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/synoptics/annotations?layoutId=${layoutId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch annotations');
      }
      
      const data = await response.json();
      setAnnotations(data);
    } catch (err) {
      console.error('Failed to load annotations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load annotations');
      
      // Fallback to localStorage if API fails
      try {
        const stored = localStorage.getItem(`annotations-${layoutId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setAnnotations(parsed);
        }
      } catch (localErr) {
        console.error('Failed to load from localStorage:', localErr);
      }
    } finally {
      setIsLoading(false);
    }
  }, [layoutId]);

  // Save annotations to API
  const saveAnnotations = useCallback(async (newAnnotations: Annotation[]) => {
    setAnnotations(newAnnotations);
    
    // Save to localStorage as backup
    try {
      localStorage.setItem(`annotations-${layoutId}`, JSON.stringify(newAnnotations));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }

    // Note: Individual updates are handled by add/update/delete methods
    // This is mainly for immediate UI update
  }, [layoutId]);

  // Add annotation
  const addAnnotation = useCallback((annotation: Annotation) => {
    const newAnnotations = [...annotations, annotation];
    saveAnnotations(newAnnotations);
  }, [annotations, saveAnnotations]);

  // Update annotation
  const updateAnnotation = useCallback((id: string, updates: Partial<Annotation>) => {
    const newAnnotations = annotations.map(a => 
      a.id === id ? { ...a, ...updates } : a
    );
    saveAnnotations(newAnnotations);
  }, [annotations, saveAnnotations]);

  // Delete annotation
  const deleteAnnotation = useCallback((id: string) => {
    const newAnnotations = annotations.filter(a => a.id !== id);
    saveAnnotations(newAnnotations);
  }, [annotations, saveAnnotations]);

  // Clear all annotations
  const clearAnnotations = useCallback(() => {
    saveAnnotations([]);
  }, [saveAnnotations]);

  return {
    annotations,
    setAnnotations: saveAnnotations,
    loadAnnotations,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    clearAnnotations,
  };
}

/**
 * TODO: Replace with API integration
 * 
 * Example API functions for future backend integration:
 * 
 * export async function fetchAnnotations(layoutId: string): Promise<Annotation[]> {
 *   const response = await fetch(`/api/synoptics/annotations/${layoutId}`);
 *   return response.json();
 * }
 * 
 * export async function saveAnnotationToAPI(layoutId: string, annotation: Annotation) {
 *   const response = await fetch('/api/synoptics/annotations', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ layoutId, annotation }),
 *   });
 *   return response.json();
 * }
 * 
 * export async function deleteAnnotationFromAPI(annotationId: string) {
 *   await fetch(`/api/synoptics/annotations/${annotationId}`, {
 *     method: 'DELETE',
 *   });
 * }
 */
