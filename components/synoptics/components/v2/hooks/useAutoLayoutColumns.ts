'use client';

import { useMemo } from 'react';
interface Node {
  id: string;
  nodeType: string;
  gasType?: string;
  buildingId?: string;
  floorId?: string;
  zoneId?: string;
  name?: string;
  label?: string;
}

interface Building {
  id: string;
  name: string;
}

interface Floor {
  id: string;
  name: string;
  floorNumber: number;
  buildingId: string;
}

interface Zone {
  id: string;
  name: string;
  floorId: string;
}

interface LayoutConfig {
  startX: number;
  startY: number;
  buildingWidth: number;
  buildingSpacing: number;
  floorHeight: number;
  floorSpacing: number;
  columnWidth: number;
  columnSpacing: number;
  valveSize: number;
  valveSpacing: number;
}

const DEFAULT_CONFIG: LayoutConfig = {
  startX: 200,
  startY: 280,
  buildingWidth: 420, // Wider for column layout
  buildingSpacing: 50,
  floorHeight: 200,
  floorSpacing: 20,
  columnWidth: 70,   // Width for each gas column
  columnSpacing: 15,  // Space between gas columns
  valveSize: 65,      // Valve width
  valveSpacing: 40,   // Vertical space between valves
};

// Gas types in order of priority (left to right)
const GAS_COLUMN_ORDER = [
  'oxygen',
  'medical_air', 
  'nitrous_oxide',
  'vacuum',
  'nitrogen',
  'carbon_dioxide',
];

interface ColumnLayoutResult {
  [nodeId: string]: { x: number; y: number; rotation?: number };
}

/**
 * Enhanced auto-layout using column-based organization by gas type
 * Creates vertical alignment across floors for better readability
 */
export function calculateColumnLayout(
  nodes: Node[],
  buildings: Building[],
  floors: Floor[], 
  zones: Zone[],
  config: LayoutConfig = DEFAULT_CONFIG
): ColumnLayoutResult {
  const result: ColumnLayoutResult = {};

  // Group nodes by building and floor
  const buildingGroups = new Map<string, {
    buildingOnly: Node[];
    floors: Map<string, {
      floorOnly: Node[];
      zones: Map<string, Node[]>;
    }>;
  }>();

  // Initialize building groups
  buildings.forEach(building => {
    buildingGroups.set(building.id, {
      buildingOnly: [],
      floors: new Map(),
    });
  });

  // Process nodes into groups
  nodes.forEach(node => {
    if (!node.buildingId) return; // Skip site-level for now

    let group = buildingGroups.get(node.buildingId);
    if (!group) {
      group = { buildingOnly: [], floors: new Map() };
      buildingGroups.set(node.buildingId, group);
    }

    if (!node.floorId) {
      // Building-level valve
      group.buildingOnly.push(node);
    } else {
      // Floor or zone valve
      if (!group.floors.has(node.floorId)) {
        group.floors.set(node.floorId, {
          floorOnly: [],
          zones: new Map(),
        });
      }
      
      const floorGroup = group.floors.get(node.floorId)!;
      
      if (!node.zoneId) {
        floorGroup.floorOnly.push(node);
      } else {
        if (!floorGroup.zones.has(node.zoneId)) {
          floorGroup.zones.set(node.zoneId, []);
        }
        floorGroup.zones.get(node.zoneId)!.push(node);
      }
    }
  });

  // Sort buildings for consistent ordering
  const sortedBuildingIds = Array.from(buildingGroups.keys()).sort();

  // Process each building
  sortedBuildingIds.forEach((buildingId, buildingIndex) => {
    const buildingX = config.startX + buildingIndex * (config.buildingWidth + config.buildingSpacing);
    const group = buildingGroups.get(buildingId)!;

    // Determine gas types present in this building
    const gasTypesInBuilding = new Set<string>();
    
    // Collect all gas types
    group.buildingOnly.forEach(node => {
      if (node.gasType) gasTypesInBuilding.add(node.gasType);
    });
    
    group.floors.forEach(floorGroup => {
      floorGroup.floorOnly.forEach(node => {
        if (node.gasType) gasTypesInBuilding.add(node.gasType);
      });
      floorGroup.zones.forEach(zoneNodes => {
        zoneNodes.forEach(node => {
          if (node.gasType) gasTypesInBuilding.add(node.gasType);
        });
      });
    });

    // Create gas column mapping
    const gasColumns = new Map<string, number>();
    let columnIndex = 0;
    
    GAS_COLUMN_ORDER.forEach(gasType => {
      if (gasTypesInBuilding.has(gasType)) {
        const columnX = buildingX + 30 + columnIndex * (config.columnWidth + config.columnSpacing);
        gasColumns.set(gasType, columnX);
        columnIndex++;
      }
    });

    // Get sorted floor numbers
    const floorNumbers = new Set<number>();
    floors.forEach(floor => {
      if (floor.buildingId === buildingId) {
        floorNumbers.add(floor.floorNumber ?? 0);
      }
    });
    const sortedFloorNumbers = Array.from(floorNumbers).sort((a, b) => b - a);

    // Layout floors
    sortedFloorNumbers.forEach((floorNumber, floorIndex) => {
      const floorY = config.startY + floorIndex * (config.floorHeight + config.floorSpacing);
      
      // Find floors at this level
      const floorsAtLevel = floors.filter(f => 
        f.buildingId === buildingId && f.floorNumber === floorNumber
      );

      floorsAtLevel.forEach(floor => {
        const floorGroup = group.floors.get(floor.id);
        if (!floorGroup) return;

        // Group valves by gas type for this floor
        const valvesByGas = new Map<string, Node[]>();
        
        // Add floor-only valves
        floorGroup.floorOnly.forEach(node => {
          const gasType = node.gasType || 'default';
          if (!valvesByGas.has(gasType)) valvesByGas.set(gasType, []);
          valvesByGas.get(gasType)!.push(node);
        });

        // Add zone valves
        floorGroup.zones.forEach(zoneNodes => {
          zoneNodes.forEach(node => {
            const gasType = node.gasType || 'default';
            if (!valvesByGas.has(gasType)) valvesByGas.set(gasType, []);
            valvesByGas.get(gasType)!.push(node);
          });
        });

        // Layout valves in columns
        valvesByGas.forEach((valves, gasType) => {
          const columnX = gasColumns.get(gasType);
          if (!columnX) return;

          // Stack valves vertically within the floor
          const startY = floorY + 30;
          valves.forEach((valve, index) => {
            result[valve.id] = {
              x: columnX,
              y: startY + index * config.valveSpacing,
              rotation: 0, // Horizontal orientation
            };
          });
        });
      });
    });

    // Layout building-level valves at the top
    if (group.buildingOnly.length > 0) {
      const buildingY = config.startY - 100;
      const valvesByGas = new Map<string, Node[]>();
      
      group.buildingOnly.forEach(node => {
        const gasType = node.gasType || 'default';
        if (!valvesByGas.has(gasType)) valvesByGas.set(gasType, []);
        valvesByGas.get(gasType)!.push(node);
      });

      valvesByGas.forEach((valves, gasType) => {
        const columnX = gasColumns.get(gasType);
        if (!columnX) return;

        valves.forEach((valve, index) => {
          result[valve.id] = {
            x: columnX,
            y: buildingY + index * 30,
            rotation: 0,
          };
        });
      });
    }
  });

  return result;
}

/**
 * Hook version for React components
 */
export function useAutoLayoutColumns(
  nodes: Node[],
  buildings: Building[],
  floors: Floor[],
  zones: Zone[],
  config?: Partial<LayoutConfig>
) {
  return useMemo(() => {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    return calculateColumnLayout(nodes, buildings, floors, zones, finalConfig);
  }, [nodes, buildings, floors, zones, config]);
}
