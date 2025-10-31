// Shared types for hierarchy management

export interface ValveInfo {
  id: string;
  name: string;
  valveType: string;
  gasType: string;
  state: 'open' | 'closed';
  nodeId?: string;
}

export interface Building {
  id: string;
  name: string;
  floors: Floor[];
}

export interface Floor {
  id: string;
  name: string;
  floorNumber: number;
  zones: Zone[];
}

export interface Zone {
  id: string;
  name: string;
}

export interface SiteData {
  id: string;
  name: string;
  organizationId: string;
  buildings: Building[];
}

export type LocationType = 'building' | 'floor' | 'zone';

export interface ValveDialogState {
  open: boolean;
  type: LocationType | null;
  targetId: string | null;
  targetName: string | null;
}
