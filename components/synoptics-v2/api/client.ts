/**
 * Centralized API client for Synoptics endpoints
 * Provides type-safe methods with consistent error handling
 */

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

class SynopticsAPIClient {
  private baseURL = '/api/synoptics';

  /**
   * Make a type-safe request to the API
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          error: 'Unknown error' 
        }));
        throw new APIError(
          error.error || 'Request failed',
          response.status,
          error
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(
        'Network request failed',
        0,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  // ========================================
  // Layout Endpoints
  // ========================================

  async getLayout(id: string) {
    return this.request(`/layouts/${id}`);
  }

  async updateNodePosition(
    nodeId: string,
    layoutId: string,
    position: { x: number; y: number }
  ) {
    return this.request(`/node-positions/update`, {
      method: 'PUT',
      body: JSON.stringify({
        nodeId,
        layoutId,
        xPosition: position.x,
        yPosition: position.y,
      }),
    });
  }

  // ========================================
  // Node Endpoints
  // ========================================

  async getNodes(organizationId: string) {
    return this.request(`/nodes?organizationId=${organizationId}`);
  }

  async createNode(data: {
    organizationId: string;
    nodeType: 'source' | 'valve' | 'fitting';
    elementId: string;
    outletCount: number;
    buildingId?: string;
    floorId?: string;
    zoneId?: string;
  }) {
    return this.request(`/nodes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNode(id: string, data: Partial<{
    buildingId: string | null;
    floorId: string | null;
    zoneId: string | null;
    outletCount: number;
  }>) {
    return this.request(`/nodes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteNode(id: string) {
    return this.request(`/nodes/${id}`, {
      method: 'DELETE',
    });
  }

  // ========================================
  // Element Endpoints (Valves, Sources, Fittings)
  // ========================================

  async createValve(data: {
    organizationId: string;
    name: string;
    valveType: string;
    gasType: string;
    state: 'open' | 'closed';
  }) {
    return this.request(`/valves`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateValve(id: string, data: Partial<{
    name: string;
    valveType: string;
    gasType: string;
    state: 'open' | 'closed';
  }>) {
    return this.request(`/valves/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteValve(id: string) {
    return this.request(`/valves/${id}`, {
      method: 'DELETE',
    });
  }

  async getValve(id: string) {
    return this.request(`/valves/${id}`);
  }

  // ========================================
  // Connection Endpoints
  // ========================================

  async createConnection(data: {
    organizationId: string;
    fromNodeId: string;
    toNodeId: string;
    gasType: string;
    diameterMm?: number | null;
  }) {
    return this.request(`/connections`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteConnection(id: string) {
    return this.request(`/connections/${id}`, {
      method: 'DELETE',
    });
  }

  // ========================================
  // Hierarchy Endpoints
  // ========================================

  async getSiteHierarchy(siteId: string) {
    return this.request(`/sites/${siteId}/hierarchy`);
  }

  async getBuildings(siteId: string) {
    return this.request(`/buildings?siteId=${siteId}`);
  }

  async getFloors(buildingId: string) {
    return this.request(`/floors?buildingId=${buildingId}`);
  }

  async getZones(floorId: string) {
    return this.request(`/zones?floorId=${floorId}`);
  }
}

// Export singleton instance
export const apiClient = new SynopticsAPIClient();
