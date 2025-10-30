'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Site {
  id: string;
  organizationId: string;
  name: string;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  createdAt: Date | string;
}

interface UseSitesDataOptions {
  organizationId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseSitesDataReturn {
  sites: Site[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createSite: (data: Partial<Site>) => Promise<Site>;
  updateSite: (siteId: string, data: Partial<Site>) => Promise<Site>;
  deleteSite: (siteId: string) => Promise<void>;
  checkCascadeDependencies: (siteId: string) => Promise<CascadeDependencies>;
}

export interface CascadeDependencies {
  buildings: number;
  floors: number;
  layouts: number;
  nodes: number;
  totalItems: number;
}

/**
 * Custom hook for managing sites data with automatic caching and optimistic updates
 */
export function useSitesData({
  organizationId,
  autoRefresh = false,
  refreshInterval = 30000,
}: UseSitesDataOptions): UseSitesDataReturn {
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sites
  const fetchSites = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/synoptics/sites?organizationId=${organizationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch sites');
      }
      
      const data = await response.json();
      setSites(data);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  }, [organizationId]);

  // Initial fetch
  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchSites();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchSites]);

  // Create site with optimistic update
  const createSite = useCallback(async (data: Partial<Site>): Promise<Site> => {
    const optimisticSite: Site = {
      id: `temp-${Date.now()}`,
      organizationId,
      name: data.name || '',
      address: data.address || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      createdAt: new Date(),
    };

    // Optimistic update
    setSites(prev => [...prev, optimisticSite]);

    try {
      const response = await fetch('/api/synoptics/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, organizationId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create site');
      }

      const newSite = await response.json();
      
      // Replace optimistic with real data
      setSites(prev => prev.map(s => s.id === optimisticSite.id ? newSite : s));
      
      return newSite;
    } catch (err) {
      // Revert optimistic update
      setSites(prev => prev.filter(s => s.id !== optimisticSite.id));
      throw err;
    }
  }, [organizationId]);

  // Update site with optimistic update
  const updateSite = useCallback(async (siteId: string, data: Partial<Site>): Promise<Site> => {
    const previousSites = [...sites];
    
    // Optimistic update
    setSites(prev => prev.map(s => s.id === siteId ? { ...s, ...data } : s));

    try {
      const response = await fetch(`/api/synoptics/sites/${siteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update site');
      }

      const updatedSite = await response.json();
      
      // Confirm update with real data
      setSites(prev => prev.map(s => s.id === siteId ? updatedSite : s));
      
      return updatedSite;
    } catch (err) {
      // Revert optimistic update
      setSites(previousSites);
      throw err;
    }
  }, [sites]);

  // Delete site with optimistic update
  const deleteSite = useCallback(async (siteId: string): Promise<void> => {
    const previousSites = [...sites];
    
    // Optimistic update
    setSites(prev => prev.filter(s => s.id !== siteId));

    try {
      const response = await fetch(`/api/synoptics/sites/${siteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete site');
      }
    } catch (err) {
      // Revert optimistic update
      setSites(previousSites);
      throw err;
    }
  }, [sites]);

  // Check cascade dependencies before deletion
  const checkCascadeDependencies = useCallback(async (siteId: string): Promise<CascadeDependencies> => {
    try {
      const response = await fetch(`/api/synoptics/sites/${siteId}/dependencies`);
      
      if (!response.ok) {
        throw new Error('Failed to check dependencies');
      }
      
      return await response.json();
    } catch (err) {
      // Return empty dependencies if endpoint doesn't exist yet
      return {
        buildings: 0,
        floors: 0,
        layouts: 0,
        nodes: 0,
        totalItems: 0,
      };
    }
  }, []);

  return {
    sites,
    isLoading,
    error,
    refetch: fetchSites,
    createSite,
    updateSite,
    deleteSite,
    checkCascadeDependencies,
  };
}
