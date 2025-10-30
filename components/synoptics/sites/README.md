# Sites Data Management System

## Overview

Refactored data management system for the `/synoptics/sites` page with modern React patterns including:

- **Optimistic Updates**: Instant UI feedback before server confirmation
- **Auto-save**: Inline editing with 1-second debounced auto-save
- **Cascade Deletion**: Intelligent warnings showing all dependencies before deletion
- **Error Handling**: Comprehensive error states with automatic rollback on failures
- **Loading States**: Granular loading indicators for better UX

## Architecture

### Components

#### `<SitesManager />`
Main orchestration component that manages the overall sites listing page.

**Props:**
- `organizationId` (string) - The organization ID to fetch sites for

**Features:**
- Fetches and displays sites
- Handles refresh functionality
- Manages delete confirmation flow
- Toast notifications for user feedback

#### `<SiteCard />`
Individual site card with inline editing capabilities.

**Props:**
- `site` (Site) - The site data to display
- `onUpdate` (function) - Callback for site updates
- `onDelete` (function) - Callback for deletion requests

**Features:**
- Click-to-edit site name
- 1-second debounced autosave
- Visual save status indicators (saving/saved/error)
- Optimistic UI updates
- Dropdown menu for actions

#### `<CascadeDeleteDialog />`
Smart deletion confirmation dialog that shows all dependencies.

**Props:**
- `open` (boolean) - Dialog open state
- `onOpenChange` (function) - Callback for open state changes
- `siteName` (string) - Name of site to delete
- `siteId` (string) - ID of site to delete
- `onConfirm` (function) - Callback when deletion is confirmed
- `onCheckDependencies` (function) - Callback to fetch dependencies

**Features:**
- Fetches and displays cascade dependencies
- Shows count of buildings, floors, layouts, and nodes
- Requires typing site name to confirm
- Color-coded warning UI

### Hooks

#### `useSitesData()`
Custom hook for managing sites data with automatic caching and optimistic updates.

**Parameters:**
```typescript
{
  organizationId: string;
  autoRefresh?: boolean;      // Enable auto-refresh
  refreshInterval?: number;   // Refresh interval in ms (default: 30000)
}
```

**Returns:**
```typescript
{
  sites: Site[];                     // Array of sites
  isLoading: boolean;                // Initial loading state
  error: string | null;              // Error message if any
  refetch: () => Promise<void>;      // Manual refetch function
  createSite: (data) => Promise<Site>;   // Create with optimistic update
  updateSite: (id, data) => Promise<Site>; // Update with optimistic update
  deleteSite: (id) => Promise<void>;      // Delete with optimistic update
  checkCascadeDependencies: (id) => Promise<CascadeDependencies>;
}
```

## Data Flow

### 1. Fetching Sites
```
User → SitesManager → useSitesData → API → Database
                           ↓
                    Local State Update
                           ↓
                    SiteCard Renders
```

### 2. Editing Site Name (Autosave)
```
User Types → Input Change → Debounce (1s) → Optimistic Update
                                                ↓
                                          API Call
                                          ↙     ↘
                                    Success    Failure
                                       ↓          ↓
                                 Confirm    Rollback
                                   State      State
```

### 3. Deleting Site
```
User → Delete Click → CascadeDeleteDialog Opens
                             ↓
                    Check Dependencies API
                             ↓
                   Show Warning with Counts
                             ↓
                    User Confirms (Types Name)
                             ↓
                   Optimistic Removal from UI
                             ↓
                      Delete API Call
                       ↙         ↘
                 Success      Failure
                    ↓            ↓
                 Toast    Rollback + Toast
```

## API Endpoints

### GET `/api/synoptics/sites?organizationId={id}`
Fetch all sites for an organization.

### POST `/api/synoptics/sites`
Create a new site.

**Body:**
```json
{
  "organizationId": "uuid",
  "name": "string",
  "address": "string?",
  "latitude": "string?",
  "longitude": "string?"
}
```

### PUT `/api/synoptics/sites/{siteId}`
Update a site.

**Body:** Partial site data

### DELETE `/api/synoptics/sites/{siteId}`
Delete a site and all cascade dependencies.

### GET `/api/synoptics/sites/{siteId}/dependencies`
Check cascade dependencies before deletion.

**Response:**
```json
{
  "buildings": 5,
  "floors": 12,
  "layouts": 3,
  "nodes": 47,
  "totalItems": 67
}
```

## Usage Example

```tsx
import { SitesManager } from '@/components/synoptics/sites';

export default function SynopticsPage() {
  const organizationId = 'your-org-id';
  return <SitesManager organizationId={organizationId} />;
}
```

## Features in Detail

### Optimistic Updates
All mutations (create, update, delete) use optimistic updates:
1. UI updates immediately
2. API call is made in background
3. On success: UI stays updated
4. On failure: UI reverts + error message

### Auto-save
Site name editing includes smart auto-save:
- Debounced by 1 second
- Shows "Saving..." indicator
- Shows "Saved" checkmark on success
- Reverts on failure
- No save button needed

### Cascade Deletion
Before deletion, the system:
1. Fetches all dependencies
2. Displays counts grouped by type
3. Requires confirmation by typing site name
4. Shows clear warning about data loss

### Error Handling
- Network errors show toast notifications
- Failed optimistic updates are rolled back
- Loading states prevent duplicate actions
- Comprehensive error messages

## Performance Considerations

- **Debounced saves**: Prevents excessive API calls during typing
- **Optimistic updates**: Instant UI feedback without waiting for server
- **Client-side caching**: Reduces unnecessary refetches
- **Efficient rendering**: Only affected components re-render

## Future Enhancements

- [ ] Add SWR or React Query for advanced caching
- [ ] Implement real-time updates via WebSockets
- [ ] Add bulk operations (multi-select delete)
- [ ] Add undo/redo functionality
- [ ] Add offline support with sync queue
