# ✅ Import Paths Fixed

## Issue
After copying v2 components from `synoptics-v2/components/` to `synoptics/components/v2/`, the relative imports were broken.

## Root Cause
Components moved one directory level deeper:
- **Before:** `synoptics-v2/components/` → imports used `../api/`
- **After:** `synoptics/components/v2/` → imports need `../../api/`

## Files Fixed
Updated all relative imports in **9 components**:

### Changed Imports
| Old Import | New Import |
|------------|------------|
| `from '../stores/ui-store'` | `from '../../stores/ui-store'` |
| `from '../stores/hierarchy-store'` | `from '../../stores/hierarchy-store'` |
| `from '../hooks/use-layout'` | `from '../../hooks/use-layout'` |
| `from '../hooks/use-nodes'` | `from '../../hooks/use-nodes'` |
| `from '../hooks/use-hierarchy'` | `from '../../hooks/use-hierarchy'` |
| `from '../hooks/use-valve-counts'` | `from '../../hooks/use-valve-counts'` |
| `from '../hooks/use-layout-counts'` | `from '../../hooks/use-layout-counts'` |
| `from '../hooks/use-gas-indicators'` | `from '../../hooks/use-gas-indicators'` |
| `from '../api/client'` | `from '../../api/client'` |

### Affected Components
1. ✅ `ElementPropertiesPanel.tsx`
2. ✅ `LayoutEditorCanvas.tsx`
3. ✅ `LayoutEditorContainer.tsx`
4. ✅ `LayoutEditorDialogs.tsx`
5. ✅ `LayoutEditorHeader.tsx`
6. ✅ `LayoutEditorSidebar.tsx`
7. ✅ `EquipmentBankEnhanced.tsx`
8. ✅ `SiteHierarchyManager.tsx`
9. ✅ `SiteHierarchyManagerOptimized.tsx`

## Verification
```bash
# Confirmed no broken relative imports remain
grep -r "from '\.\./\(api\|stores\|hooks\)/" components/v2/
# Returns: No results (all fixed!)
```

## Status
✅ **All imports fixed** - Components should now resolve correctly
