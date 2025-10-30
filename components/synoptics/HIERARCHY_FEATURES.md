# Physical Infrastructure Hierarchy Features

This document explains the new hierarchical location filtering and valve impact analysis features that leverage the physical infrastructure hierarchy in the synoptics system.

## Overview

The system now supports organizing gas distribution network elements (nodes) by their physical location in the infrastructure:

```
Organizations (multi-tenant isolation)
 └── Sites (hospitals)
     └── Buildings
         └── Floors
             └── Zones
```

Each node (source, valve, fitting) can be optionally assigned to:
- **Building**: Which building the element is located in
- **Floor**: Which floor within the building
- **Zone**: Which zone/room within the floor
- **Unassigned/External**: Elements not inside buildings (e.g., external sources)

## Features Implemented

### 1. Hierarchical Location Filter

**Purpose**: Filter and view elements on the layout by their physical location (buildings, floors, zones).

**Access**: Click the "Locations" button in the layout editor toolbar (keyboard shortcut: `Ctrl+H`).

**Features**:
- **Hierarchical Tree View**: Browse the complete site → building → floor → zone hierarchy
- **Multi-Select Filtering**: Select multiple locations at any level to show only those elements
- **Node Counts**: See how many elements are in each location (real-time counts)
- **Collapsible Tree**: Expand/collapse buildings and floors for easier navigation
- **Unassigned Elements**: Toggle visibility of elements not assigned to any building
- **Quick Actions**:
  - **Select All**: Show all locations
  - **Clear All**: Reset to showing everything

**Visual Indicators**:
- 🏢 **Blue**: Buildings
- 📚 **Green**: Floors
- 📦 **Purple**: Zones
- 📦 **Gray**: Unassigned/External

**Use Cases**:
1. **Focus on a specific building**: View only elements in "Building A"
2. **Floor-specific maintenance**: Show only elements on "2nd Floor"
3. **Zone isolation**: View elements in "ICU Zone" or "Operating Room 3"
4. **Multi-floor comparison**: Select multiple floors to compare layouts

### 2. Valve Impact Analyzer

**Purpose**: See which parts of the infrastructure are affected when a valve is closed.

**Access**: 
1. Click on any valve in the layout
2. The "Impact" button appears in the toolbar
3. Click "Impact" to open the analyzer

**Features**:

#### Impact Summary
- **Total Downstream Elements**: Count of all elements that will lose supply
- **Critical Valves**: Number of other valves that will be affected
- **Severity Indication**: Color-coded by impact level:
  - 🟢 **Green**: No impact (0 elements)
  - 🟡 **Yellow**: Low impact (1-4 elements)
  - 🟠 **Orange**: Medium impact (5-9 elements)
  - 🔴 **Red**: High impact (10+ elements)

#### Location-Based Impact Breakdown
See exactly which parts of the hospital will be affected:

**By Building**:
- Shows which buildings will lose gas supply
- Lists all affected elements per building

**By Floor**:
- Shows which floors will be affected
- Helps identify multi-floor impacts

**By Zone**:
- Shows which specific zones/rooms will lose supply
- Critical for healthcare environments (ICU, OR, patient rooms)

**Unassigned/External**:
- Shows affected elements outside building structure

#### Interactive Features
- **Highlight Affected Network**: Button to highlight all affected nodes on the layout
- **Expandable Sections**: Collapse/expand each category for focused viewing
- **Element Lists**: See names of all affected elements in each location

**Use Cases**:
1. **Maintenance Planning**: "If I close valve V307, which ORs will be affected?"
2. **Emergency Response**: "Which zones will lose oxygen if this valve fails?"
3. **Impact Assessment**: "How many patient rooms depend on this supply line?"
4. **Risk Analysis**: "Will closing this valve affect other critical valves?"

### 3. Element Location Assignment

**Purpose**: Assign physical location (building/floor/zone) to each element.

**Access**: 
1. Unlock the layout (click "Unlock to Edit")
2. Click on any element (source, valve, or fitting)
3. Scroll down in the properties panel to "Physical Location"

**Features**:
- **Cascading Dropdowns**: 
  - Select building → floors for that building appear
  - Select floor → zones for that floor appear
- **Unassigned Option**: Keep elements unassigned (for external sources, etc.)
- **Empty State Handling**: Shows helpful message if no locations are configured
- **Auto-Save**: Location assignments are saved automatically

**Field Hierarchy**:
1. **Building** (optional): Main building location
2. **Floor** (optional, requires building): Specific floor in the building
3. **Zone** (optional, requires floor): Specific zone/room on the floor

**Use Cases**:
1. **New Installation**: Assign location when adding a new valve or outlet
2. **Asset Management**: Track which building/floor each element is on
3. **Documentation**: Maintain accurate location records for maintenance
4. **Compliance**: Meet regulatory requirements for asset location tracking

## Database Schema

The system uses the following optional foreign keys on the `nodes` table:

```typescript
nodes {
  id: uuid
  organizationId: uuid (required)
  nodeType: enum ('source', 'valve', 'fitting')
  elementId: uuid (required)
  
  // Physical location (all optional)
  buildingId: uuid | null
  floorId: uuid | null
  zoneId: uuid | null
  
  // Other fields...
}
```

## API Endpoints Used

The features interact with these API endpoints:

```
GET  /api/synoptics/sites?organizationId={id}
GET  /api/synoptics/buildings?siteId={id}
GET  /api/synoptics/floors?buildingId={id}
GET  /api/synoptics/zones?floorId={id}
PUT  /api/synoptics/nodes/{nodeId}
```

## Workflow Examples

### Example 1: Assign Location to a Valve

1. Unlock the layout editor
2. Click on valve "V307"
3. In properties panel, select:
   - Building: "Main Building"
   - Floor: "2nd Floor - ICU"
   - Zone: "ICU Room 203"
4. Click "Save Changes"

### Example 2: View Only 2nd Floor Elements

1. Click "Locations" button
2. Expand "Main Building"
3. Click on "2nd Floor - ICU"
4. Layout now shows only elements on that floor
5. Click "Clear All" to reset

### Example 3: Assess Valve Closure Impact

1. Click on valve "Main Oxygen Shutoff"
2. Click "Impact" button
3. View summary: "24 downstream elements affected"
4. Expand "By Floor": See 4 floors will be impacted
5. Expand "By Zone": See 12 ICU zones affected
6. Click "Highlight Affected Network" to visualize on layout
7. Make informed decision about maintenance timing

### Example 4: Multi-Location Filtering

1. Click "Locations" button
2. Select "Building A - 2nd Floor"
3. Also select "Building B - 3rd Floor"
4. Also select "Unassigned / External" (for sources)
5. Layout shows only elements in these three locations
6. Use for comparing layouts across buildings

## Technical Implementation

### Components Created

1. **`HierarchicalLocationFilter`** (`hierarchical-location-filter.tsx`)
   - Tree-based location browser
   - Multi-select functionality
   - Real-time node counting
   - Integrates with layout filtering

2. **`ValveImpactAnalyzer`** (`valve-impact-analyzer.tsx`)
   - Graph traversal algorithm (BFS) for downstream impact
   - Location-based grouping
   - Severity calculation
   - Interactive highlighting

3. **Enhanced `ElementPropertiesPanel`** (`element-properties-panel.tsx`)
   - Location assignment fields
   - Cascading dropdowns
   - Async loading of hierarchy
   - Node update API calls

### Integration Points

The features integrate with:
- **UnifiedLayoutEditor**: Main orchestration component
- **NetworkFilterPanel**: Combined with network filters
- **EnhancedSynopticViewer**: Node visibility and highlighting
- **Node database queries**: Location metadata retrieval

### Algorithm: Valve Impact Analysis

```typescript
// Breadth-first search downstream from valve
function analyzeImpact(valveId, connections) {
  const affectedNodes = new Set();
  const queue = [valveId];
  const visited = new Set();
  
  while (queue.length > 0) {
    const currentNode = queue.shift();
    if (visited.has(currentNode)) continue;
    visited.add(currentNode);
    
    // Find all downstream connections
    const downstream = connections
      .filter(c => c.fromNodeId === currentNode)
      .map(c => c.toNodeId);
    
    downstream.forEach(nodeId => {
      affectedNodes.add(nodeId);
      queue.push(nodeId);
    });
  }
  
  return affectedNodes;
}
```

## Best Practices

### For Hospital Administrators
1. **Complete Location Data**: Assign locations to all elements for accurate impact analysis
2. **Consistent Naming**: Use clear, consistent names for zones (e.g., "ICU-203" not "Room 3")
3. **Regular Audits**: Verify location assignments during maintenance visits
4. **Emergency Plans**: Use impact analyzer to create emergency response procedures

### For Maintenance Teams
1. **Pre-Work Analysis**: Check valve impact before any shutoff work
2. **Document Locations**: Always record element locations in the system
3. **Verify Assignments**: Confirm location data matches physical reality
4. **Use Filters**: Isolate work areas using location filters

### For System Designers
1. **Hierarchical Design**: Design gas networks with clear hierarchical structure
2. **Redundancy Planning**: Use impact analyzer to identify single points of failure
3. **Zone Isolation**: Ensure critical zones can be isolated independently
4. **Documentation**: Keep location hierarchy up-to-date in the database

## Future Enhancements

Potential improvements:
- **3D Visualization**: Show elements in 3D building models
- **Auto-Assignment**: Suggest locations based on network topology
- **Impact Scheduling**: Schedule maintenance based on impact scores
- **Historical Analysis**: Track which zones are affected most often
- **Mobile Access**: View locations and impacts on mobile devices
- **Report Generation**: Export impact analysis reports (PDF)
- **Real-time Monitoring**: Link to sensor data by location

## Troubleshooting

**Location filter not showing buildings?**
- Ensure sites and buildings are created in the system
- Check that organizationId is correctly passed

**Impact analyzer showing 0 elements?**
- Verify connections between nodes are properly created
- Check that the network graph is connected

**Can't assign location to element?**
- Ensure you're in edit mode (unlocked)
- Verify buildings/floors/zones exist in the database
- Check API endpoint responses in browser console

**Filtered view shows no elements?**
- Check "Unassigned / External" is selected
- Verify elements have location assignments
- Click "Clear All" to reset filters

## Support

For issues or questions:
1. Check browser console for errors
2. Verify database schema includes location fields
3. Ensure API endpoints return expected data
4. Review network tab for failed requests
