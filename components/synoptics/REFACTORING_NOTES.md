# Site Equipment Map Refactoring

## Overview
Consolidated two separate map components into a single, comprehensive equipment management component.

## Changes

### Deleted Components
- ❌ `SiteMapView.tsx` - Simple read-only site location map
- ❌ `SiteValveMap.tsx` - Equipment map with filtering

### New Component
- ✅ `SiteEquipmentMap.tsx` - Unified equipment management with multiple views

## Features

### Multiple View Modes
1. **Map View** - Interactive Mapbox visualization with clustering
2. **Grid View** - Card-based layout for detailed equipment overview
3. **List View** - Compact scrollable list for quick scanning

### Equipment Support
- **Valves** - With status indicators (open, closed, maintenance, alarm)
- **Sources** - Gas supply equipment
- **Fittings** - Connection equipment

### Advanced Filtering
- Equipment type filters (valve, source, fitting)
- Valve status filters with color coding
- Building and floor location filters
- Real-time search across name, gas type, and equipment type

### Interactive Features
- Click equipment cards to edit (name, location, media)
- Map markers with popups showing equipment details
- Cluster expansion on map for grouped equipment
- Coordinate-based location tracking
- Building and floor information display

### Technical Improvements
- Single query key: `site-equipment` (instead of `valves-map`)
- Proper map initialization and resize handling
- Efficient data transformation with useMemo
- Query invalidation on updates for data consistency
- TypeScript interfaces for all data structures

## Migration Guide

### Before
```tsx
import { SiteMapView, SiteValveMap } from '@/components/synoptics';

// Two separate components
<SiteMapView latitude={lat} longitude={lng} />
<SiteValveMap siteId={id} ... />
```

### After
```tsx
import { SiteEquipmentMap } from '@/components/synoptics';

// Single unified component with view modes
<SiteEquipmentMap 
  siteId={id}
  siteName={name}
  siteLatitude={lat}
  siteLongitude={lng}
  buildings={buildings}
/>
```

## Benefits
1. **Unified UX** - Single interface for all equipment management
2. **Better Performance** - Single data fetch, optimized rendering
3. **Enhanced Filtering** - More powerful and intuitive filters
4. **Improved Maintainability** - One codebase instead of two
5. **Feature Parity** - All features from both components combined
6. **Future Ready** - Easier to add new view modes or equipment types

## Date
November 6, 2025
