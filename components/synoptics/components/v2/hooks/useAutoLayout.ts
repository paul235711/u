import { useMemo } from 'react';

interface Node {
  id: string;
  nodeType: string;
  buildingId?: string | null;
  floorId?: string | null;
  zoneId?: string | null;
  gasType?: string;
  floorNumber?: number;
  buildingName?: string;
  zoneName?: string;
  position?: {
    x?: number;
    y?: number;
    xPosition?: number;
    yPosition?: number;
  };
  data?: Record<string, any>;
}

interface Floor {
  id: string;
  floorNumber: number;
  name?: string;
}

interface Building {
  id: string;
  name: string;
}

interface Zone {
  id: string;
  name: string;
}

export interface AutoLayoutConfig {
  // Starting position
  startX: number;
  startY: number;
  
  // Building containers
  buildingWidth: number;
  buildingSpacing: number;
  buildingPadding: number;
  
  // Floor containers
  floorHeight: number;
  floorSpacing: number;
  floorPadding: number;
  
  // Zone containers
  zoneMinWidth: number;
  zoneSpacing: number;
  zonePadding: number;
  
  // Valve layout within zones
  valveSpacing: number;
  
  // Column layout for gas types (grid mode)
  useColumnLayout?: boolean;
  columnWidth?: number;
  columnSpacing?: number;
  
  // Visual hierarchy
  buildingValveScale?: number;
  floorValveScale?: number;
  zoneValveScale?: number;

  // Layout mode
  // - 'grid': current flexbox-inspired grid by building/floor/zone
  // - 'trunk': vertical main line with horizontal branches (Layout 1 style)
  mode?: 'grid' | 'trunk';

  // Horizontal offsets used in trunk mode
  // Offset of the trunk inside the building column
  trunkOffsetX?: number;
  // Distance between trunk and branch columns/zones
  branchOffsetX?: number;
}

const DEFAULT_CONFIG: AutoLayoutConfig = {
  startX: 200,
  startY: 280,
  
  // Building containers - wider for column layout
  buildingWidth: 420,
  buildingSpacing: 40,
  buildingPadding: 15,
  
  // Floor containers
  floorHeight: 200,
  floorSpacing: 15,
  floorPadding: 15,
  
  // Zone containers - optimized for columns
  zoneMinWidth: 100,
  zoneSpacing: 5,
  zonePadding: 10,
  
  // Valves
  valveSpacing: 45,
  
  // Column layout
  useColumnLayout: true,
  columnWidth: 80,
  columnSpacing: 25,
  
  // Visual hierarchy
  buildingValveScale: 1.2,
  floorValveScale: 1.0,
  zoneValveScale: 0.9,
  
  // Default to grid layout; trunk can be enabled via config
  mode: 'grid',
  trunkOffsetX: 80,
  branchOffsetX: 140,
};

interface LayoutResult {
  [nodeId: string]: { x: number; y: number; scale?: number };
}

// Building order for horizontal layout (left to right)
const BUILDING_ORDER: Record<string, number> = {
  dominicaines: 0,
  medecine: 1,
  chirurgie: 2,
};

// Gas type display order (top to bottom within zone)
const GAS_ORDER: Record<string, number> = {
  oxygen: 0,
  medical_air: 1,
  nitrous_oxide: 2,
  vacuum: 3,
};

/**
 * Grid-based auto layout matching the mockup exactly:
 * - Buildings: horizontal left-to-right (Dominicaines, Médecine, Chirurgie)
 * - Floors: vertical top-to-bottom by floor number (highest to lowest)
 * - Floor cells: full building width × floor height rectangles
 * - Zones: sub-boxes within floor cells
 * - Valves: stacked vertically within zones or floor areas
 * - Building-only valves: below the main grid
 * - Site-level nodes: top-left corner outside grid
 */
export function useAutoLayout(
  nodes: Node[],
  buildings: Building[] = [],
  floors: Floor[] = [],
  zones: Zone[] = [],
  config: Partial<AutoLayoutConfig> = {}
): LayoutResult {
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);

  return useMemo(() => {
    return calculateAutoLayoutPositions(nodes, buildings, floors, zones, finalConfig);
  }, [nodes, buildings, floors, zones, finalConfig]);
}

/**
 * Standalone function to calculate positions without React hooks.
 */
function calculateAutoLayoutPositions(
  nodes: Node[],
  buildings: Building[] = [],
  floors: Floor[] = [],
  zones: Zone[] = [],
  config: AutoLayoutConfig
): LayoutResult {
  const result: LayoutResult = {};

  // Ensure we have arrays (defensive checks)
  const safeBuildings = Array.isArray(buildings) ? buildings : [];
  const safeFloors = Array.isArray(floors) ? floors : [];
  const safeZones = Array.isArray(zones) ? zones : [];
  const safeNodes = Array.isArray(nodes) ? nodes : [];

  // Create lookup maps
  const buildingMap = new Map(safeBuildings.map((b) => [b.id, b]));
  const floorMap = new Map(safeFloors.map((f) => [f.id, f]));
  const zoneMap = new Map(safeZones.map((z) => [z.id, z]));

  // Global floor grid: align floors across all buildings by floorNumber
  const uniqueFloorNumbers = Array.from(
    new Set(safeFloors.map((f) => f.floorNumber ?? 0))
  ).sort((a, b) => b - a); // descending
  if (uniqueFloorNumbers.length === 0) {
    uniqueFloorNumbers.push(0);
  }
  const floorNumberToIndex = new Map<number, number>();
  uniqueFloorNumbers.forEach((num, idx) => {
    floorNumberToIndex.set(num, idx);
  });

  // Separate nodes by association level
  const siteNodes: Node[] = []; // no building
  const siteGasMap = new Map<string, Node[]>();

  // buildingId -> gasType -> Node[]
  const buildingOnlyMap = new Map<string, Map<string, Node[]>>();

  // buildingId -> floorId -> { floorOnly: Map<gasType, Node[]>; zones: Map<zoneId, Map<gasType, Node[]>> }
  const buildingFloors = new Map<
    string,
    Map<string, { floorOnly: Map<string, Node[]>; zones: Map<string, Map<string, Node[]>> }>
  >();

  safeNodes.forEach((node) => {
    const gasKey = node.gasType || 'default';

    // Site-level nodes: no building
    if (!node.buildingId) {
      siteNodes.push(node);
      if (!siteGasMap.has(gasKey)) siteGasMap.set(gasKey, []);
      siteGasMap.get(gasKey)!.push(node);
      return;
    }

    const buildingId = node.buildingId;

    // Building-only nodes: building but no floor
    if (!node.floorId) {
      if (!buildingOnlyMap.has(buildingId)) {
        buildingOnlyMap.set(buildingId, new Map());
      }
      const gasMap = buildingOnlyMap.get(buildingId)!;
      if (!gasMap.has(gasKey)) gasMap.set(gasKey, []);
      gasMap.get(gasKey)!.push(node);
      return;
    }

    // Floor-level (with or without zone)
    if (!buildingFloors.has(buildingId)) {
      buildingFloors.set(buildingId, new Map());
    }
    const floorsInBuilding = buildingFloors.get(buildingId)!;

    const floorId = node.floorId;
    if (!floorsInBuilding.has(floorId)) {
      floorsInBuilding.set(floorId, {
        floorOnly: new Map<string, Node[]>(),
        zones: new Map<string, Map<string, Node[]>>(),
      });
    }
    const floorEntry = floorsInBuilding.get(floorId)!;

    // Floor-only valves: no zone
    if (!node.zoneId) {
      if (!floorEntry.floorOnly.has(gasKey)) {
        floorEntry.floorOnly.set(gasKey, []);
      }
      floorEntry.floorOnly.get(gasKey)!.push(node);
      return;
    }

    // Zone-level valves
    const zoneId = node.zoneId;
    if (!floorEntry.zones.has(zoneId)) {
      floorEntry.zones.set(zoneId, new Map<string, Node[]>());
    }
    const zoneGasMap = floorEntry.zones.get(zoneId)!;
    if (!zoneGasMap.has(gasKey)) zoneGasMap.set(gasKey, []);
    zoneGasMap.get(gasKey)!.push(node);
  });

  // Determine building order (left-to-right)
  const buildingIdsSet = new Set<string>();
  buildingFloors.forEach((_floors, bId) => buildingIdsSet.add(bId));
  buildingOnlyMap.forEach((_gas, bId) => buildingIdsSet.add(bId));

  const sortedBuildingIds = Array.from(buildingIdsSet).sort((aId, bId) => {
    const aBuilding = buildingMap.get(aId);
    const bBuilding = buildingMap.get(bId);
    const aName = aBuilding?.name.toLowerCase() || '';
    const bName = bBuilding?.name.toLowerCase() || '';

    const aOrderKey = Object.keys(BUILDING_ORDER).find((k) => aName.includes(k));
    const bOrderKey = Object.keys(BUILDING_ORDER).find((k) => bName.includes(k));

    const aIndex = aOrderKey ? BUILDING_ORDER[aOrderKey] : 999;
    const bIndex = bOrderKey ? BUILDING_ORDER[bOrderKey] : 999;

    return aIndex - bIndex;
  });

  // === Trunk layout mode (Layout 1 style) ===
  // Vertical main line per building with horizontal branches per zone
  if (config.mode === 'trunk') {
    sortedBuildingIds.forEach((buildingId, buildingIndex) => {
      const buildingX = config.startX + buildingIndex * (config.buildingWidth + config.buildingSpacing);
      const trunkX = buildingX + config.buildingPadding + (config.trunkOffsetX ?? 80);

      const floorsInBuilding = buildingFloors.get(buildingId) || new Map();

      floorsInBuilding.forEach((floorEntry, floorId) => {
        const floorMeta = floorMap.get(floorId);
        const floorNum = floorMeta?.floorNumber ?? 0;
        const levelIndex = floorNumberToIndex.get(floorNum) ?? 0;

        const floorY = config.startY + levelIndex * (config.floorHeight + config.floorSpacing);
        const floorContentX = buildingX + config.floorPadding;
        const floorContentY = floorY + config.floorPadding;
        const floorContentWidth = config.buildingWidth - 2 * config.floorPadding;
        const floorContentHeight = config.floorHeight - 2 * config.floorPadding;

        // 1) Trunk valves on this floor: floor-only valves (all gases)
        const trunkNodes: Node[] = [];
        floorEntry.floorOnly.forEach((nodesArr: Node[]) => {
          nodesArr.forEach((n) => trunkNodes.push(n));
        });

        // If no explicit floor-only valves, take one representative per zone
        if (trunkNodes.length === 0) {
          floorEntry.zones.forEach((zoneGasMap: Map<string, Node[]>) => {
            for (const [, valvesInGas] of zoneGasMap) {
              if (valvesInGas.length > 0) {
                trunkNodes.push(valvesInGas[0]);
                break;
              }
            }
          });
        }

        const placedIds = new Set<string>();

        if (trunkNodes.length > 0) {
          const totalHeight = (trunkNodes.length - 1) * config.valveSpacing;
          const baseY = floorContentY + (floorContentHeight - totalHeight) / 2;

          trunkNodes.forEach((node, index) => {
            result[node.id] = {
              x: trunkX,
              y: baseY + index * config.valveSpacing,
            };
            placedIds.add(node.id);
          });
        }

        // 2) Branch valves: remaining zone valves, distributed per zone horizontally
        const zonesArray = Array.from(floorEntry.zones.entries()) as [string, Map<string, Node[]>][];
        zonesArray.sort(([aId], [bId]) => {
          const aZone = zoneMap.get(aId);
          const bZone = zoneMap.get(bId);
          return (aZone?.name || '').localeCompare(bZone?.name || '');
        });

        const zoneCount = zonesArray.length;
        if (zoneCount > 0) {
          const zoneGaps = Math.max(0, zoneCount - 1) * config.zoneSpacing;
          const availableWidth = floorContentWidth - zoneGaps;
          const zoneWidth = Math.floor(availableWidth / Math.max(zoneCount, 1));

          let currentX = floorContentX;

          zonesArray.forEach(([zoneId, zoneGasMap]) => {
            const zoneValves: Node[] = [];
            zoneGasMap.forEach((nodesArr: Node[]) => {
              nodesArr.forEach((n) => {
                if (!placedIds.has(n.id)) {
                  zoneValves.push(n);
                }
              });
            });

            if (zoneValves.length > 0) {
              const totalHeight = (zoneValves.length - 1) * config.valveSpacing;
              const baseY = floorContentY + (floorContentHeight - totalHeight) / 2;
              const centerX = currentX + zoneWidth / 2 + (config.branchOffsetX ?? 0) / 2;

              zoneValves.forEach((node, index) => {
                result[node.id] = {
                  x: centerX,
                  y: baseY + index * config.valveSpacing,
                };
              });
            }

            currentX += zoneWidth + config.zoneSpacing;
          });
        }
      });

      // 3) Building-only valves: align on trunk below all floors
      const buildingGasMap = buildingOnlyMap.get(buildingId);
      if (buildingGasMap && buildingGasMap.size > 0) {
        const buildingValves: Node[] = [];
        buildingGasMap.forEach((nodesArr: Node[]) => {
          nodesArr.forEach((n) => buildingValves.push(n));
        });

        if (buildingValves.length > 0) {
          const buildingOnlyY =
            config.startY + uniqueFloorNumbers.length * (config.floorHeight + config.floorSpacing) + 20;

          buildingValves.forEach((node, index) => {
            result[node.id] = {
              x: trunkX,
              y: buildingOnlyY + index * config.valveSpacing,
            };
          });
        }
      }
    });

    // Site-level nodes: positioned to the left of the building grid (simple vertical stack)
    if (siteNodes.length > 0) {
      const orderedValves: Node[] = [];
      const sortedGases = Array.from(siteGasMap.entries()).sort(([a], [b]) => {
        const aOrder = GAS_ORDER[a] ?? 999;
        const bOrder = GAS_ORDER[b] ?? 999;
        return aOrder - bOrder;
      });

      sortedGases.forEach(([, valvesInGas]) => {
        valvesInGas.forEach((valve) => orderedValves.push(valve));
      });

      if (orderedValves.length > 0) {
        const baseX = config.startX - 150;
        const baseY = config.startY - 100;

        orderedValves.forEach((valve, index) => {
          result[valve.id] = {
            x: baseX,
            y: baseY + index * config.valveSpacing,
          };
        });
      }
    }

    return result;
  }

  // Helper function to layout valves in columns by gas type
  const layoutValvesInColumns = (
    gasMap: Map<string, Node[]>,
    containerX: number,
    containerY: number,
    containerWidth: number,
    containerHeight: number,
    level: 'building' | 'floor' | 'zone' = 'zone'
  ) => {
    if (!config.useColumnLayout) {
      // Fallback to vertical stacking
      layoutValvesVertically(gasMap, containerX, containerY, containerWidth, containerHeight);
      return;
    }

    // Create columns for each gas type
    const gasColumns = new Map<string, { x: number; valves: Node[] }>();
    let columnIndex = 0;
    
    // Sort gases by priority order
    const sortedGases = Array.from(gasMap.entries()).sort(([a], [b]) => {
      const aOrder = GAS_ORDER[a] ?? 999;
      const bOrder = GAS_ORDER[b] ?? 999;
      return aOrder - bOrder;
    });
    
    // Assign column positions
    sortedGases.forEach(([gasType, valves]) => {
      const columnX = containerX + 20 + columnIndex * (config.columnWidth! + config.columnSpacing!);
      gasColumns.set(gasType, { x: columnX, valves });
      columnIndex++;
    });
    
    // Layout valves in each column
    gasColumns.forEach(({ x, valves }, gasType) => {
      const startY = containerY + 20;
      const scale = level === 'building' ? config.buildingValveScale : 
                   level === 'floor' ? config.floorValveScale : 
                   config.zoneValveScale;
      
      valves.forEach((valve, index) => {
        result[valve.id] = {
          x: x,
          y: startY + index * config.valveSpacing,
          ...(scale && scale !== 1.0 ? { scale } : {}),
        };
      });
    });
  };
  
  // Fallback function for vertical stacking
  const layoutValvesVertically = (
    gasMap: Map<string, Node[]>,
    containerX: number,
    containerY: number,
    containerWidth: number,
    containerHeight: number
  ) => {
    const orderedValves: Node[] = [];
    const sortedGases = Array.from(gasMap.entries()).sort(([a], [b]) => {
      const aOrder = GAS_ORDER[a] ?? 999;
      const bOrder = GAS_ORDER[b] ?? 999;
      return aOrder - bOrder;
    });

    sortedGases.forEach(([, valvesInGas]) => {
      valvesInGas.forEach((valve) => orderedValves.push(valve));
    });

    if (orderedValves.length === 0) return;

    const centerX = containerX + containerWidth / 2;
    const startY = containerY + 20 + (containerHeight - (orderedValves.length - 1) * config.valveSpacing) / 2;

    orderedValves.forEach((valve, index) => {
      result[valve.id] = {
        x: centerX,
        y: startY + index * config.valveSpacing,
      };
    });
  };

  // Create building columns with proper spacing
  sortedBuildingIds.forEach((buildingId, buildingIndex) => {
    const buildingX = config.startX + buildingIndex * (config.buildingWidth + config.buildingSpacing);

    const floorsInBuilding = buildingFloors.get(buildingId) || new Map();

    // Process each floor in this building
    floorsInBuilding.forEach((floorEntry, floorId) => {
      const floorMeta = floorMap.get(floorId);
      const floorNum = floorMeta?.floorNumber ?? 0;
      const levelIndex = floorNumberToIndex.get(floorNum) ?? 0;

      // Floor container bounds
      const floorY = config.startY + levelIndex * (config.floorHeight + config.floorSpacing);

      // Get zones for this floor and sort them
      const zones = Array.from(floorEntry.zones.entries()) as [string, Map<string, Node[]>][];
      zones.sort(([aId], [bId]) => {
        const aZone = zoneMap.get(aId);
        const bZone = zoneMap.get(bId);
        return (aZone?.name || '').localeCompare(bZone?.name || '');
      });

      const hasFloorOnly = floorEntry.floorOnly.size > 0;
      const totalZones = zones.length + (hasFloorOnly ? 1 : 0);

      if (totalZones > 0) {
        // Floor content area (with padding)
        const floorContentX = buildingX + config.floorPadding;
        const floorContentY = floorY + config.floorPadding;
        const floorContentWidth = config.buildingWidth - 2 * config.floorPadding;
        const floorContentHeight = config.floorHeight - 2 * config.floorPadding;

        // Calculate zone dimensions to fit within floor
        const zoneGaps = Math.max(0, totalZones - 1) * config.zoneSpacing;
        const availableWidth = floorContentWidth - zoneGaps;
        const zoneWidth = Math.floor(availableWidth / totalZones);
        
        // Start zones from left edge of floor content area
        let currentX = floorContentX;

        // Layout floor-only valves first if present
        if (hasFloorOnly) {
          layoutValvesInColumns(
            floorEntry.floorOnly,
            currentX,
            floorContentY,
            zoneWidth,
            floorContentHeight,
            'floor'
          );
          currentX += zoneWidth + config.zoneSpacing;
        }

        // Layout each zone
        zones.forEach(([zoneId, zoneGasMap], idx) => {
          layoutValvesInColumns(
            zoneGasMap,
            currentX,
            floorContentY,
            zoneWidth,
            floorContentHeight,
            'zone'
          );
          currentX += zoneWidth + config.zoneSpacing;
        });
    }
  });

  // Building-only valves: below all floors for this building
  const buildingGasMap = buildingOnlyMap.get(buildingId);
  if (buildingGasMap && buildingGasMap.size > 0) {
    const buildingOnlyY = config.startY + uniqueFloorNumbers.length * (config.floorHeight + config.floorSpacing) + 20;
    const buildingOnlyHeight = 100;
    // Layout valves
    layoutValvesInColumns(
      buildingGasMap,
      buildingX,
      buildingOnlyY,
      config.buildingWidth,
      buildingOnlyHeight,
      'building'
    );
  }
});

// Site-level nodes: positioned to the left of the building grid
if (siteNodes.length > 0) {
  // Layout site-level nodes in top-left corner
  layoutValvesVertically(
    siteGasMap,
    config.startX - 150,
    config.startY - 100,
    120,
    80
  );
}

return result;
}

/**
 * Function to apply auto-layout positions to nodes array.
 * Returns a new array with updated positions.
 */
export function applyAutoLayout(
  nodes: Node[],
  buildings: Building[] = [],
  floors: Floor[] = [],
  zones: Zone[] = [],
  config: Partial<AutoLayoutConfig> = {}
): Node[] {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const positions = calculateAutoLayoutPositions(nodes, buildings, floors, zones, finalConfig);

  return nodes.map((node) => {
    const newPosition = positions[node.id];
    if (newPosition) {
      const updatedNode: Node = {
        ...node,
        position: { x: newPosition.x, y: newPosition.y },
        data: {
          ...node.data,
        },
      };
      
      // Add scale to data if present for visual hierarchy
      if (newPosition.scale && newPosition.scale !== 1.0) {
        updatedNode.data = {
          ...updatedNode.data,
          scale: newPosition.scale,
        };
      }
      
      // Mark building-level and floor-level valves
      if (node.buildingId && !node.floorId) {
        updatedNode.data = {
          ...updatedNode.data,
          isBuildingLevel: true,
        };
      } else if (node.floorId && !node.zoneId) {
        updatedNode.data = {
          ...updatedNode.data,
          isFloorLevel: true,
        };
      }
      
      return updatedNode;
    }
    return node;
  });
}
