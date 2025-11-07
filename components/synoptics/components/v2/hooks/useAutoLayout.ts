import { useMemo } from 'react';

interface Node {
  id: string;
  nodeType: string;
  buildingId?: string;
  floorId?: string;
  gasType?: string;
  position?: {
    x?: number;
    y?: number;
    xPosition?: number;
    yPosition?: number;
  };
}

interface AutoLayoutConfig {
  buildingSpacing: number;  // Horizontal spacing between buildings
  floorSpacing: number;     // Vertical spacing between floors
  gasSpacing: number;       // Vertical spacing between same building/floor/gas items
  startX: number;
  startY: number;
}

const DEFAULT_CONFIG: AutoLayoutConfig = {
  buildingSpacing: 400,
  floorSpacing: 300,
  gasSpacing: 120,
  startX: 100,
  startY: 100,
};

interface LayoutResult {
  [nodeId: string]: { x: number; y: number };
}

/**
 * Hook to calculate automatic layout positions based on building, floor, and gas type.
 * 
 * Logic:
 * - X axis: Buildings are distributed horizontally
 * - Y axis: Floors are distributed vertically
 * - Same building/floor with multiple gas types: stacked vertically with gasSpacing
 */
export function useAutoLayout(
  nodes: Node[],
  config: Partial<AutoLayoutConfig> = {}
): LayoutResult {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return useMemo(() => {
    const result: LayoutResult = {};

    // Group nodes by building and floor
    const hierarchy = new Map<string, Map<string, Map<string, Node[]>>>();

    nodes.forEach((node) => {
      const buildingKey = node.buildingId || 'unknown';
      const floorKey = node.floorId || 'unknown';
      const gasKey = node.gasType || 'default';

      if (!hierarchy.has(buildingKey)) {
        hierarchy.set(buildingKey, new Map());
      }
      const building = hierarchy.get(buildingKey)!;

      if (!building.has(floorKey)) {
        building.set(floorKey, new Map());
      }
      const floor = building.get(floorKey)!;

      if (!floor.has(gasKey)) {
        floor.set(gasKey, []);
      }
      floor.get(gasKey)!.push(node);
    });

    // Sort buildings and floors for consistent layout
    const sortedBuildings = Array.from(hierarchy.entries()).sort(([a], [b]) => 
      a.localeCompare(b)
    );

    let buildingIndex = 0;

    sortedBuildings.forEach(([buildingId, floors]) => {
      const buildingX = finalConfig.startX + buildingIndex * finalConfig.buildingSpacing;

      // Sort floors (assuming floor IDs or names can be sorted)
      const sortedFloors = Array.from(floors.entries()).sort(([a], [b]) => 
        a.localeCompare(b)
      );

      let floorIndex = 0;

      sortedFloors.forEach(([floorId, gases]) => {
        const baseFloorY = finalConfig.startY + floorIndex * finalConfig.floorSpacing;

        // Sort gas types for consistent ordering
        const sortedGases = Array.from(gases.entries()).sort(([a], [b]) => 
          a.localeCompare(b)
        );

        let gasOffset = 0;

        sortedGases.forEach(([gasType, nodesInGroup]) => {
          // Position each node in this group
          nodesInGroup.forEach((node, nodeIndex) => {
            const x = buildingX;
            const y = baseFloorY + gasOffset;

            result[node.id] = { x, y };

            // Stack multiple nodes of same gas type horizontally with small offset
            gasOffset += finalConfig.gasSpacing;
          });
        });

        floorIndex++;
      });

      buildingIndex++;
    });

    return result;
  }, [nodes, finalConfig]);
}

/**
 * Function to apply auto-layout positions to nodes array.
 * Returns a new array with updated positions.
 */
export function applyAutoLayout(nodes: Node[], config?: Partial<AutoLayoutConfig>): Node[] {
  const positions = calculateAutoLayoutPositions(nodes, config);

  return nodes.map((node) => {
    const newPosition = positions[node.id];
    if (newPosition) {
      return {
        ...node,
        position: {
          x: newPosition.x,
          y: newPosition.y,
          xPosition: newPosition.x,
          yPosition: newPosition.y,
        },
      };
    }
    return node;
  });
}

/**
 * Standalone function to calculate positions without React hooks.
 */
function calculateAutoLayoutPositions(
  nodes: Node[],
  config: Partial<AutoLayoutConfig> = {}
): LayoutResult {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const result: LayoutResult = {};

  // Group nodes by building and floor
  const hierarchy = new Map<string, Map<string, Map<string, Node[]>>>();

  nodes.forEach((node) => {
    const buildingKey = node.buildingId || 'unknown';
    const floorKey = node.floorId || 'unknown';
    const gasKey = node.gasType || 'default';

    if (!hierarchy.has(buildingKey)) {
      hierarchy.set(buildingKey, new Map());
    }
    const building = hierarchy.get(buildingKey)!;

    if (!building.has(floorKey)) {
      building.set(floorKey, new Map());
    }
    const floor = building.get(floorKey)!;

    if (!floor.has(gasKey)) {
      floor.set(gasKey, []);
    }
    floor.get(gasKey)!.push(node);
  });

  // Sort buildings and floors for consistent layout
  const sortedBuildings = Array.from(hierarchy.entries()).sort(([a], [b]) => 
    a.localeCompare(b)
  );

  let buildingIndex = 0;

  sortedBuildings.forEach(([buildingId, floors]) => {
    const buildingX = finalConfig.startX + buildingIndex * finalConfig.buildingSpacing;

    const sortedFloors = Array.from(floors.entries()).sort(([a], [b]) => 
      a.localeCompare(b)
    );

    let floorIndex = 0;

    sortedFloors.forEach(([floorId, gases]) => {
      const baseFloorY = finalConfig.startY + floorIndex * finalConfig.floorSpacing;

      const sortedGases = Array.from(gases.entries()).sort(([a], [b]) => 
        a.localeCompare(b)
      );

      let gasOffset = 0;

      sortedGases.forEach(([gasType, nodesInGroup]) => {
        nodesInGroup.forEach((node) => {
          const x = buildingX;
          const y = baseFloorY + gasOffset;

          result[node.id] = { x, y };

          gasOffset += finalConfig.gasSpacing;
        });
      });

      floorIndex++;
    });

    buildingIndex++;
  });

  return result;
}
