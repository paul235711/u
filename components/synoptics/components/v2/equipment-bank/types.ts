export type EquipmentNodeType = 'source' | 'valve' | 'fitting';

export interface EquipmentNode {
  id: string;
  siteId: string;
  nodeType: EquipmentNodeType;
  elementId: string;
  buildingId?: string | null;
  floorId?: string | null;
  zoneId?: string | null;
  name?: string | null;
  gasType?: string | null;
  position?: {
    x?: number | string;
    y?: number | string;
    xPosition?: number | string;
    yPosition?: number | string;
    rotation?: number;
  };
  [key: string]: any;
}

export interface EquipmentDetailsRecord {
  [nodeId: string]: Record<string, any> | undefined;
}

export interface EquipmentPosition {
  nodeId: string;
  layoutId: string;
  xPosition: string;
  yPosition: string;
  rotation?: number;
}

export interface EquipmentBankEnhancedProps {
  siteId: string;
  layoutId: string;
  layout?: {
    nodes?: EquipmentNode[];
    [key: string]: any;
  };
  onAddToLayout: (nodeId: string) => void;
  onClose: () => void;
}
