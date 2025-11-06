# Equipment Map Sub-Components

This directory contains the refactored sub-components for the `SiteEquipmentMap` feature.

## Structure

```
equipment-map/
├── EquipmentViewSwitcher.tsx  (~60 lines)  - Header with view mode toggle
├── EquipmentFilters.tsx       (~200 lines) - Complete filtering UI
├── EquipmentMapView.tsx       (~280 lines) - Mapbox integration
├── EquipmentGridView.tsx      (~90 lines)  - Grid card layout
├── EquipmentListView.tsx      (~90 lines)  - Scrollable list layout
├── index.ts                              - Clean exports
└── README.md                             - This file
```

## Components

### EquipmentViewSwitcher
**Purpose**: Header with equipment counts and view mode selector

**Props**:
- `viewMode`: Current view mode ('map' | 'grid' | 'list')
- `onViewModeChange`: Callback when view mode changes
- `totalCount`: Total equipment count
- `withCoordsCount`: Equipment with coordinates count

### EquipmentFilters
**Purpose**: All filtering controls in one component

**Props**:
- `searchTerm`, `onSearchChange`: Search functionality
- `selectedTypes`, `onTypeToggle`: Equipment type filters
- `activeStatuses`, `onStatusToggle`: Valve status filters
- `selectedBuildingId`, `onBuildingChange`: Building filter
- `selectedFloorId`, `onFloorChange`: Floor filter
- `buildings`: Available buildings
- `floorsForSelectedBuilding`: Floors for selected building
- `filteredCount`, `totalCount`: Filter summary
- `onReset`: Reset all filters

### EquipmentMapView
**Purpose**: Mapbox map with equipment markers and clustering

**Props**:
- `isLoading`, `isError`: Loading/error states
- `featureCollection`: GeoJSON data for map
- `equipmentWithCoordsCount`: Count for empty state
- `mapCenter`: Map center coordinates
- `onMapReady`, `mapReady`: Map initialization state

**Features**:
- Equipment markers with status-based colors
- Cluster support for grouped equipment
- Interactive popups
- Click to zoom on clusters
- Auto-fit bounds to equipment

### EquipmentGridView
**Purpose**: Responsive grid of equipment cards

**Props**:
- `isLoading`: Loading state
- `equipment`: Filtered equipment array
- `hasEquipment`: Whether any equipment exists
- `buildingMap`: Building lookup map
- `onEquipmentClick`: Click handler for editing

**Features**:
- Responsive grid (1-4 columns)
- Full equipment cards with details
- Loading and empty states

### EquipmentListView
**Purpose**: Scrollable compact list view

**Props**:
- Same as EquipmentGridView

**Features**:
- Scrollable area (600px height)
- Compact equipment cards
- Space-efficient layout

## Usage

```tsx
import { SiteEquipmentMap } from './SiteEquipmentMap';

<SiteEquipmentMap
  siteId={siteId}
  siteName={siteName}
  siteLatitude={lat}
  siteLongitude={lng}
  buildings={buildings}
/>
```

## Benefits of This Structure

1. **Separation of Concerns**: Each component has one responsibility
2. **Reusability**: Components can be used independently
3. **Maintainability**: Easier to update individual features
4. **Testability**: Can test each component in isolation
5. **Performance**: Can optimize individual components
6. **Collaboration**: Multiple developers can work on different components

## Main Component Size Reduction

- **Before**: 818 lines (monolithic)
- **After**: ~250 lines (orchestrator)
- **Reduction**: ~70% smaller main file

## Dependencies

- `@tanstack/react-query` - Data fetching
- `mapbox-gl` - Map rendering
- `lucide-react` - Icons
- UI components from `@/components/ui`
