# PHASE_2_4_LAYOUT_EXTRACTION.md

**Goal**: Complete the architectural refactoring by extracting layout management and the massive `NotesUI` component, finalizing the transition to a modular 1.1.0 codebase.

## 1. Analysis of Current State
- **App.jsx** (~3,300 lines) still acts as a "God Component", containing:
  - `NotesUI` (internal component, likely 1,500+ lines).
  - Manual hash routing logic.
  - Legacy `TagSidebar` logic (overlapping with new `Sidebar` component).
  - Duplicate helper functions and CSS injections.
- **NotesUI**: Receives 50+ props, defeating the purpose of the Context API implementation in Phase 2.3.
- **DashboardLayout**: Exists in `src/components/` but is not effectively used to wrap the core application view.

## 2. Refactoring Plan

### Step 1: Extract `NotesUI` to `src/components/NotesView.jsx`
- **Action**: Move the entire function definition to a new file.
- **Cleanup**: Remove props that can be replaced by `useAuth`, `useNotes`, `useSettings` hooks.
- **Integration**: `DashboardLayout` should wrap this content.

### Step 2: Implement `DashboardLayout`
- **Action**: Ensure `NotesView` uses `DashboardLayout` for its shell (Sidebar + Header).
- **Consolidation**: Moving Search and User Menu logic from `App.jsx` to `DashboardLayout`.

### Step 3: Clean `App.jsx`
- **Action**: Reduce `App.jsx` to a routing manager.
- **Logic**:
  - `App` should only handle:
    - Context Providers (Root).
    - High-level routing (Admin vs Login vs Notes).
    - Global toasts/modals that stay above everything.
- **Removal**: Delete `globalCSS` string (move to `src/index.css` or `useSettings`).

## 3. Execution Strategy
1. **Extract**: Create `NotesView.jsx` directly.
2. **Refactor Props**: Update `NotesView` to consume Contexts instead of props.
3. **Wire Up**: Update `App.jsx` to render `<NotesView />`.
4. **Layout**: Wrap `NotesView` content with `<DashboardLayout />`.

## 4. Verification
- Verify Sidebar navigation works.
- Verify Search functionality (moved to Layout).
- Verify User Dropdown (moved to Layout).
- Verify "Add Note" flow still works within the new layout.
