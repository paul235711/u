# Equipment Import Feature

## Overview

The Equipment Import feature allows users to import existing equipment (nodes) from their site into a layout. Equipment is organized hierarchically by buildings, floors, and zones, making it easy to find and select specific items or entire sections.

## Features

### 1. Hierarchical Organization
- **Buildings**: Top-level organization
- **Floors**: Within each building
- **Zones**: Specific rooms or areas within floors
- **Unassigned**: Equipment without geographical assignment

### 2. Selection Options
- **Individual Selection**: Click on any equipment item to select/deselect
- **Multi-Select**: Select multiple items across different locations
- **Select All by Location**: Quickly select all equipment in a building, floor, or zone
- **Select All**: Import all available equipment at once
- **Clear Selection**: Deselect all items

### 3. Search & Filter
- Search equipment by name, type (source/valve/fitting), or gas type
- Real-time filtering as you type
- Equipment count display showing selected vs. available

### 4. Smart Import
- Automatically arranges imported equipment in a grid pattern
- Prevents duplicate imports (equipment already in layout)
- Shows import progress and results
- Auto-refreshes layout after successful import

## User Interface

### Access
1. Open a layout in the layout editor
2. Click "Unlock to Edit" to enable editing mode
3. Click the "Import Equipment" button in the toolbar (visible only in edit mode)

### Dialog Components

#### Header
- Title: "Import Existing Equipment"
- Description explaining the feature
- Error display area (if any issues occur)

#### Search Bar
- Search by equipment name, type, or gas
- Real-time filtering

#### Action Bar
- Selection counter: "X of Y equipment selected"
- "Select All" button
- "Clear Selection" button

#### Equipment List
Organized hierarchically:

```
🏢 Building Name (X items)
  [Select All button]
  ├── Equipment at building level
  ├── 📚 Floor 1 (X items)
  │   [Select All button]
  │   ├── Equipment at floor level
  │   └── 📦 Zone Name (X items)
  │       [Select All button]
  │       └── Equipment in zone
  └── 📚 Floor 2...

📦 Unassigned / External (X items)
  └── Equipment without location
```

#### Equipment Item Display
Each item shows:
- Icon (🔵 source, 🔴 valve, ⚪ fitting)
- Equipment name
- Type (source/valve/fitting)
- Gas type (color-coded)
- Additional details (valve type, fitting type)

#### Footer
- "Cancel" button
- "Import (X)" button (disabled if no selection)

## Technical Implementation

### Components

#### `EquipmentImportDialog`
Location: `/components/synoptics/equipment-import-dialog.tsx`

Main dialog component that handles:
- Data loading from API
- Equipment filtering and organization
- Selection state management
- Import operation

**Props:**
- `open`: boolean - Dialog visibility
- `onClose`: () => void - Close handler
- `organizationId`: string - Current organization
- `siteId`: string - Current site
- `layoutId`: string - Target layout
- `onImport`: (nodeIds: string[]) => Promise<void> - Import handler

### API Endpoints

#### 1. Get Site Hierarchy
```
GET /api/synoptics/sites/[siteId]/hierarchy
```
Returns complete site structure with buildings, floors, and zones.

#### 2. Get Layout Nodes
```
GET /api/synoptics/layouts/[layoutId]/nodes
```
Returns all nodes currently in the layout (to prevent duplicates).

#### 3. Get All Equipment
```
GET /api/synoptics/nodes?organizationId={id}
```
Returns all equipment nodes for the organization with full element data.

#### 4. Import Nodes
```
POST /api/synoptics/layouts/[layoutId]/import-nodes
Body: { nodeIds: string[] }
```
Imports selected nodes into the layout with auto-positioning.

**Response:**
```json
{
  "success": true,
  "imported": 5,
  "failed": 0,
  "results": [...],
  "errors": []
}
```

### Database Queries

New helper functions in `/lib/db/synoptics-queries.ts`:

- `getNodeWithElementData(nodeId)`: Gets node with merged element data
- `getNodesWithElementDataByOrganizationId(organizationId)`: Gets all nodes with element data

### Integration

The feature is integrated into `UnifiedLayoutEditor`:

1. Added `siteId` prop to enable the feature
2. Added "Import Equipment" button in toolbar (edit mode only)
3. Added import handler that calls the API and refreshes the layout
4. Dialog appears when button is clicked

## Usage Examples

### Example 1: Import All Equipment from a Building
1. Open layout editor and unlock
2. Click "Import Equipment"
3. Find the building you want
4. Click "Select All" next to the building name
5. Click "Import (X)"
6. Equipment appears in a grid on the layout

### Example 2: Import Specific Zones
1. Open layout editor and unlock
2. Click "Import Equipment"
3. Expand building → expand floor
4. Click "Select All" for each zone you want
5. Click "Import (X)"

### Example 3: Search and Import
1. Open layout editor and unlock
2. Click "Import Equipment"
3. Type "oxygen" in search box
4. Select individual oxygen equipment items
5. Click "Import (X)"

### Example 4: Import All Unassigned Equipment
1. Open layout editor and unlock
2. Click "Import Equipment"
3. Scroll to "Unassigned / External" section
4. Select equipment or click "Select All"
5. Click "Import (X)"

## Auto-Positioning

Imported equipment is automatically arranged in a grid:
- **Grid spacing**: 150 pixels
- **Starting position**: (100, 100)
- **Layout**: Square grid (√n items per row)

Example for 9 items:
```
[1] [2] [3]
[4] [5] [6]
[7] [8] [9]
```

Users can then drag items to their desired positions.

## Error Handling

The feature handles various error scenarios:

1. **Network errors**: Shows error message in dialog
2. **Duplicate imports**: Prevents importing nodes already in layout
3. **Missing data**: Shows appropriate empty states
4. **API failures**: Displays error details to user

## UI Components Created

### Checkbox Component
Location: `/components/ui/checkbox.tsx`
- Native HTML checkbox with custom styling
- Compatible with the equipment selection interface

### ScrollArea Component
Location: `/components/ui/scroll-area.tsx`
- Native overflow scrolling
- Used for the equipment list

## Benefits

1. **Time Saving**: Import multiple equipment items at once instead of creating them individually
2. **Organization**: Equipment is already organized by location
3. **Accuracy**: Import existing equipment with all properties intact
4. **Flexibility**: Choose exactly what to import with multiple selection methods
5. **Efficiency**: Auto-positioning saves manual placement time

## Future Enhancements

Potential improvements:
- **Smart positioning**: Position based on actual geographical coordinates
- **Bulk editing**: Edit properties of multiple imported items
- **Import templates**: Save and reuse common import selections
- **Connection import**: Optionally import connections between equipment
- **Preview mode**: Preview equipment positions before importing
- **Undo import**: Ability to undo an import operation
- **Import history**: Track what was imported and when
