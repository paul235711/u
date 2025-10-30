# 🧪 TEST V2 NOW - Quick Guide

**Status:** ✅ Server Running | V2 Active | Ready to Test

---

## ⚡ INSTANT TEST (2 Minutes)

### Step 1: Open Layout Editor
Navigate to any layout page in your app:
```
http://localhost:3000/synoptics/layouts/[any-layout-id]
```

### Step 2: Check Browser Console
Open DevTools (F12) and look for:
```
✅ [Feature Flag] layout-editor: new
✅ [Feature Flag] properties-panel: new
```

If you see **"new"** → **You're running V2!** 🎉

---

## 🎯 WHAT TO LOOK FOR

### Visual Changes
- ✅ Layout loads smoothly
- ✅ Header shows layout name
- ✅ Lock/unlock button works
- ✅ Can drag nodes (when unlocked)
- ✅ Properties panel opens on click

### Browser Console
```javascript
✅ [Feature Flag] layout-editor: new
✅ [Feature Flag] properties-panel: new
❌ No errors (check this!)
```

### Network Tab (F12 → Network)
- ✅ Fewer API requests than before
- ✅ See 304 responses (cached)
- ✅ React Query deduplication working

---

## 🛠️ OPEN DEVTOOLS

### Redux DevTools (Install if needed)
1. Chrome: [Install Extension](https://chrome.google.com/webstore/detail/redux-devtools)
2. Firefox: [Install Extension](https://addons.mozilla.org/firefox/addon/reduxdevtools/)
3. Look for Redux icon in browser toolbar
4. Click → Should see **"SynopticsUI"** store

**What to see:**
```
Store: SynopticsUI
Actions:
  - toggleLock
  - selectElement
  - togglePanel
  - setDialog
```

### React Query DevTools (Already Included)
1. Look for **floating button** (bottom-right of page)
2. Click to expand
3. Should see queries:
   ```
   ✅ ['layout', layoutId]
   ✅ ['element', elementId]
   ✅ ['hierarchy', orgId]
   ```

---

## ✅ TESTING CHECKLIST

### Properties Panel
- [ ] Click on a node
- [ ] Properties panel opens on right
- [ ] Form fields populated
- [ ] Edit a value
- [ ] Click "Save Changes"
- [ ] UI updates instantly (optimistic!)
- [ ] No page reload
- [ ] Console: `[Feature Flag] properties-panel: new`

### Layout Editor
- [ ] Click lock/unlock button
- [ ] State changes (see in Redux DevTools)
- [ ] Drag a node (when unlocked)
- [ ] Position updates instantly
- [ ] Create a connection between nodes
- [ ] Delete a node
- [ ] Toggle stats panel
- [ ] Toggle filters panel
- [ ] Console: `[Feature Flag] layout-editor: new`

### DevTools
- [ ] Redux DevTools shows "SynopticsUI"
- [ ] See actions when clicking buttons
- [ ] React Query DevTools shows queries
- [ ] Cache time shows ~5 minutes
- [ ] No errors in console

---

## 🔄 COMPARE OLD vs NEW

### Test Old Version
```bash
# Edit .env
NEXT_PUBLIC_USE_NEW_LAYOUT_EDITOR=false

# Wait for reload or restart
pnpm dev

# Test same features
# Console shows: [Feature Flag] layout-editor: old
```

### Test New Version
```bash
# Edit .env
NEXT_PUBLIC_USE_NEW_LAYOUT_EDITOR=true

# Wait for reload or restart
pnpm dev

# Test same features
# Console shows: [Feature Flag] layout-editor: new
```

### What Should Be Same
- ✅ All features work
- ✅ No broken functionality
- ✅ Same user experience

### What Should Be Better (V2)
- ✅ Faster (cached requests)
- ✅ Smoother (optimistic updates)
- ✅ Debuggable (DevTools)
- ✅ No console errors

---

## 🐛 IF SOMETHING BREAKS

### Quick Checks
1. **Console errors?**
   - Check browser console
   - Look for red errors
   - Note the error message

2. **DevTools working?**
   - Redux DevTools installed?
   - React Query DevTools visible?
   - Store name correct?

3. **Feature flag active?**
   - Console shows "new"?
   - `.env` file correct?
   - Server reloaded?

### Instant Rollback
```bash
# Edit .env
NEXT_PUBLIC_USE_NEW_LAYOUT_EDITOR=false

# Restart if needed
pnpm dev

# Back to old version!
```

### Debug Steps
1. Check `.env` file
2. Restart dev server
3. Clear browser cache
4. Hard reload (Cmd+Shift+R)
5. Check console for errors
6. Check DevTools for state

---

## 📊 EXPECTED BEHAVIOR

### On Page Load
```
1. Page loads layout editor
2. Wrapper checks feature flag
3. Flag = true → Routes to V2
4. LayoutEditorContainer loads
5. React Query fetches layout
6. Zustand initializes state
7. Components render
8. Console: "[Feature Flag] layout-editor: new"
```

### When Clicking Node
```
1. Click event fires
2. Zustand: selectElement(nodeId)
3. Redux DevTools shows action
4. ElementPropertiesPanel opens
5. React Query fetches element data
6. Form populates
7. Console: "[Feature Flag] properties-panel: new"
```

### When Saving Changes
```
1. Click "Save Changes"
2. React Query mutation fires
3. UI updates INSTANTLY (optimistic)
4. API call happens in background
5. If success: cache updated
6. If error: UI reverts (rollback)
7. No page reload!
```

---

## 🎯 SUCCESS CRITERIA

### You'll Know It's Working When:
- ✅ Console shows "new" for both flags
- ✅ No errors in console
- ✅ Redux DevTools shows state changes
- ✅ React Query DevTools shows queries
- ✅ UI updates instantly when saving
- ✅ Everything works smoothly

### Performance Improvements:
- ✅ Network tab shows fewer requests
- ✅ See 304 cached responses
- ✅ UI feels snappier
- ✅ No full-page reloads

---

## 💡 PRO TIPS

### Debugging
- Use Redux DevTools for state issues
- Use React Query DevTools for data issues
- Use Network tab for API issues
- Use Console for errors

### Testing
- Test with real data
- Test edge cases (empty, errors)
- Test slow network (throttle in DevTools)
- Compare old vs new side-by-side

### Monitoring
- Watch Network tab (fewer requests)
- Watch Console (no errors)
- Watch DevTools (state correct)
- Watch Performance (faster)

---

## 🚀 YOU'RE READY!

**Everything is set up. Now just:**

1. **Navigate to layout editor**
2. **Check console for "new"**
3. **Test features**
4. **Enjoy V2!** ✨

---

**Server:** Running on http://localhost:3000  
**Feature Flags:** ✅ ENABLED  
**Status:** 🚀 READY TO TEST  

**Go test it now! 🎉**
