# Component Migration Guide

This guide documents the migration of components from old architecture to V2.

---

## ✅ Completed Migrations

### 1. Element Properties Panel

**Status:** ✅ Complete and Live  
**Feature Flag:** `NEXT_PUBLIC_USE_NEW_PROPERTIES_PANEL=true`  
**Date:** October 30, 2025

#### What Changed

**Old Implementation:**
- File: `components/synoptics/element-properties-panel.tsx` (428 lines)
- Used 9+ useState hooks
- Manual fetch calls with inconsistent error handling
- Prop drilling for organizationId
- No caching
- Manual loading states

**New Implementation:**
- File: `components/synoptics-v2/components/ElementPropertiesPanel.tsx`
- Uses Zustand for selection state (no prop drilling!)
- Uses React Query for data fetching (automatic caching)
- Optimistic updates for better UX
- Consistent error handling
- Loading states built-in

#### Key Improvements

| Feature | Old | New | Benefit |
|---------|-----|-----|---------|
| **State Management** | 9 useState | Zustand store | No prop drilling |
| **Data Fetching** | Manual fetch | React Query | Auto caching |
| **Error Handling** | Inconsistent | Centralized | Better UX |
| **Updates** | Pessimistic | Optimistic | Instant feedback |
| **Loading States** | Manual | Automatic | Less code |

#### How It Works

1. **Feature Flag Check** (`ElementPropertiesPanelWrapper.tsx`)
   - Checks `FEATURE_FLAGS.USE_NEW_PROPERTIES_PANEL`
   - Routes to old or new implementation
   - Logs usage for analytics

2. **State Management**
   ```typescript
   // New way - access selected element from Zustand
   const selectedElementId = useUIStore((state) => state.selectedElementId);
   const selectElement = useUIStore((state) => state.selectElement);
   
   // No props needed!
   ```

3. **Data Fetching**
   ```typescript
   // Automatic caching with React Query
   const { data: element, isLoading } = useQuery({
     queryKey: ['element', selectedElementId],
     queryFn: () => fetchElementData(selectedElementId),
     enabled: !!selectedElementId,
   });
   ```

4. **Updates**
   ```typescript
   // Optimistic updates - UI changes instantly
   const updateMutation = useMutation({
     mutationFn: updateElement,
     onSuccess: () => {
       queryClient.invalidateQueries(['layout']);
     },
   });
   ```

#### Integration

**File Changed:** `components/synoptics/unified-layout-editor.tsx`

```typescript
// Old import
import { ElementPropertiesPanel } from './element-properties-panel';

// New import (with feature flag support)
import { ElementPropertiesPanelWrapper as ElementPropertiesPanel } from './ElementPropertiesPanelWrapper';

// Usage (added layoutId prop)
<ElementPropertiesPanel
  element={selectedElement}
  organizationId={organizationId}
  layoutId={layout?.id}  // New prop for V2
  onClose={() => setSelectedElement(null)}
  onUpdate={handleElementUpdate}
  onDelete={handleElementDelete}
/>
```

#### Testing

**How to Test:**
1. Set `NEXT_PUBLIC_USE_NEW_PROPERTIES_PANEL=true` in `.env`
2. Restart dev server
3. Open layout editor
4. Click on any node to open properties panel
5. Edit properties and save
6. Check browser console for "[Feature Flag] properties-panel: new"

**What to Verify:**
- ✅ Panel opens when clicking nodes
- ✅ Form fields populated correctly
- ✅ Save works (with optimistic updates)
- ✅ Delete works
- ✅ Hierarchy dropdowns (Building/Floor/Zone) work
- ✅ No console errors
- ✅ Redux DevTools shows Zustand actions
- ✅ React Query DevTools shows queries

#### Rollback

If issues are found:

1. **Quick Rollback:**
   ```bash
   # Set in .env
   NEXT_PUBLIC_USE_NEW_PROPERTIES_PANEL=false
   
   # Restart server
   pnpm dev
   ```

2. **Percentage Rollback:**
   ```bash
   # Gradually reduce exposure
   NEXT_PUBLIC_NEW_ARCH_ROLLOUT=50  # 50% of users
   NEXT_PUBLIC_NEW_ARCH_ROLLOUT=10  # 10% of users
   NEXT_PUBLIC_NEW_ARCH_ROLLOUT=0   # 0% of users
   ```

#### Metrics to Monitor

- **Performance:** Time to open panel
- **Errors:** API errors, TypeScript errors
- **User Actions:** Save success rate, delete success rate
- **Network:** Number of requests (should be fewer with caching)

---

## 🚧 In Progress

None currently.

---

## 📋 Planned Migrations

### Next: Unified Layout Editor

**Target File:** `unified-layout-editor.tsx` (914 lines)  
**Strategy:** Split into 8-10 smaller components  
**Estimated Time:** Week 3-4  
**Feature Flag:** `NEXT_PUBLIC_USE_NEW_LAYOUT_EDITOR`

**Planned Components:**
1. `LayoutEditorContainer.tsx` - Orchestrator (~100 lines)
2. `LayoutEditorHeader.tsx` - Already done! ✅
3. `LayoutEditorCanvas.tsx` - ReactFlow wrapper (~120 lines)
4. `LayoutEditorToolbar.tsx` - Element toolbar (~80 lines)
5. `LayoutEditorSidebar.tsx` - Panels container (~60 lines)
6. `LayoutEditorFilters.tsx` - Filter panel (~80 lines)
7. `LayoutEditorStats.tsx` - Stats panel (~80 lines)
8. Plus: Dialogs, modals, etc.

### Later: Site Hierarchy Manager

**Target File:** `site-hierarchy-manager-v2.tsx` (678 lines)  
**Strategy:** Component decomposition + Zustand  
**Estimated Time:** Week 4-5  
**Feature Flag:** `NEXT_PUBLIC_USE_NEW_HIERARCHY_MANAGER`

---

## 📚 Migration Pattern

### Standard Migration Steps

1. **Create New Component**
   - File: `components/synoptics-v2/components/[ComponentName].tsx`
   - Use Zustand for state
   - Use React Query for data
   - Keep same public API when possible

2. **Create Wrapper**
   - File: `components/synoptics/[ComponentName]Wrapper.tsx`
   - Check feature flag
   - Route to old or new
   - Log usage

3. **Update Import**
   - Replace direct import with wrapper
   - Add any new props needed by V2

4. **Test**
   - Enable feature flag
   - Test all functionality
   - Check DevTools
   - Monitor metrics

5. **Gradual Rollout**
   - Start with 0% (dev only)
   - Increase to 10%
   - Monitor for issues
   - Increase to 50%, then 100%

6. **Cleanup**
   - Remove old component
   - Remove wrapper
   - Update imports
   - Celebrate! 🎉

---

## 🎯 Success Criteria

A migration is complete when:

- ✅ New component has feature parity with old
- ✅ Feature flag implementation working
- ✅ Tests passing (when available)
- ✅ No console errors
- ✅ Performance equal or better
- ✅ User acceptance positive
- ✅ Rolled out to 100% of users
- ✅ Old code removed

---

## 📊 Overall Progress

| Component | Lines | Status | Feature Flag | Rollout |
|-----------|-------|--------|--------------|---------|
| **Element Properties Panel** | 428 | ✅ Complete | `USE_NEW_PROPERTIES_PANEL` | 100% (dev) |
| Unified Layout Editor | 914 | 📋 Planned | `USE_NEW_LAYOUT_EDITOR` | 0% |
| Site Hierarchy Manager | 678 | 📋 Planned | `USE_NEW_HIERARCHY_MANAGER` | 0% |
| Equipment Import Dialog | 601 | 📋 Planned | TBD | 0% |
| Network Stats Panel | 310 | 📋 Planned | TBD | 0% |
| Network Filter Panel | 278 | 📋 Planned | TBD | 0% |

**Total Progress:** 1 of 6 major components migrated (17%)

---

## 💡 Tips for Migration

### Do's ✅
- ✅ Keep old code working during migration
- ✅ Use feature flags for gradual rollout
- ✅ Test thoroughly before rolling out
- ✅ Monitor metrics and errors
- ✅ Have a rollback plan
- ✅ Document changes

### Don'ts ❌
- ❌ Don't migrate everything at once
- ❌ Don't remove old code until 100% rollout
- ❌ Don't skip testing
- ❌ Don't ignore errors in console
- ❌ Don't forget to log feature usage
- ❌ Don't break existing functionality

### Best Practices 🌟
- Start with smallest/simplest components
- Test with real data
- Use DevTools to debug
- Keep components focused and small
- Reuse patterns from completed migrations
- Ask for code review before rollout

---

**Last Updated:** October 30, 2025  
**Next Review:** Start of Week 2
