# Phase 2.2 Integration Plan

**Current Status:** Components created, ready for integration
**Estimated Time:** 2-3 hours for full integration

## Tasks Remaining

### Task 1: Add Component Imports ✅ Ready
Add to top of App.jsx after line 8:
```javascript
import { SearchBar } from "./components/SearchBar";
import { NoteCard as NoteCardComponent } from "./components/NoteCard";
```

**Current State:**
- SearchBar.jsx exists and is exported ✅
- NoteCard.jsx exists and is exported ✅
- Ready to import

### Task 2: Remove Inline NoteCard Function Definition
- Current inline function: Around line 2800-3100
- After import: Delete the inline `function NoteCard(...)` definition
- The component still calls `<NoteCard />` inline, so we need to replace ALL instances
- Expected lines saved: ~300 lines

### Task 3: Replace Search Input with SearchBar Component
- Find: Inline search input in NotesUI (around line 6400-6500)
- Replace with: `<SearchBar value={search} onChange={setSearch} onAiSearch={handleAiSearch} localAiEnabled={localAiEnabled} dark={dark} placeholder="Search..." />`
- Expected lines saved: ~30 lines

### Task 4: Replace NoteCard Rendering
- Find: All `<NoteCard` calls in notes grid (2 locations: pinned section + others section)
- These are already using the NoteCard component function inline
- After Task 2 deletion, these will automatically use the imported component
- No changes needed! Just delete the function definition

### Task 5: Extract Helper Components (Optional, Lower Priority)
- ColorDot component (~20 lines)
- ColorPicker component (~50 lines)
- TransparencyPicker component (~40 lines)
- Expected total: ~110 lines

---

## Notes on Approach

**Important:** The inline NoteCard function in App.jsx is likely identical to what we created in NoteCard.jsx. We can:
1. Delete the inline version
2. Import from components/NoteCard.jsx
3. Everything should work immediately

This is a **safe refactoring** because:
- NoteCard.jsx was created from the same logic
- No prop interfaces are changing
- All calls remain the same
- Just moving the function to a separate file

---

## What We're NOT Doing Yet

- ❌ Modal/Composer extraction (needs Context API first)
- ❌ Admin/Settings panels extraction (needs Context API first)
- ❌ Full component library refactoring (for Phase 3)

---

## Validation Checklist

After completing all tasks:
- [ ] Build passes: `npm run build`
- [ ] No errors in browser console
- [ ] Notes grid displays correctly
- [ ] Search still works
- [ ] SearchBar component works
- [ ] All three note types display
- [ ] Pin/unpin still works
- [ ] Multi-select still works
- [ ] Drag-drop reordering still works
- [ ] Line count reduced by ~330 lines

---

## Files to Modify

1. `/workspaces/react-glass-keep/src/App.jsx`
   - Add imports (2 lines)
   - Remove inline NoteCard function (~300 lines)
   - Replace search input JSX (~30 lines)
   - Net change: -328 lines

## Files Already Created

1. ✅ `/workspaces/react-glass-keep/src/components/SearchBar.jsx` (50 lines)
2. ✅ `/workspaces/react-glass-keep/src/components/NoteCard.jsx` (280 lines)

---

**Ready to execute:** Yes, all dependencies are in place.
