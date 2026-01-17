# Phase 2.3: React Context API Implementation Plan

**Phase Status:** 🔄 50% Complete (Foundation + Integration done, Modal extraction next)
**Estimated Duration Remaining:** 2-3 hours for Phase 2.3.3
**Current App.jsx:** 6,573 lines
**Target After Phase 2.3:** 5,000-5,300 lines

## Executive Summary

Phase 2.3 implements React Context API to eliminate prop drilling and prepare for Modal/Composer component extraction. Currently, complex components like Modal and Composer pass 50+ props through the component tree. Context API will reduce this to <10 props per component.

**Key Achievement:** After Phase 2.3, we can extract Modal and Composer as independent, testable components.

---

## Completion Status

### ✅ Phase 2.3.1: Foundation Setup (100% Complete)
- Created 6 contexts: Auth, Notes, Settings, UI, Composer, Modal
- Created RootProvider component
- All contexts tested and working
- Build passes cleanly

### ✅ Phase 2.3.2: App Integration (100% Complete)
- Wrapped App with RootProvider in main.jsx
- Updated imports to use contexts instead of hooks
- Configured context nesting order
- NotesProvider gets token from AuthContext
- All tests pass, build clean

### ⏳ Phase 2.3.3: Modal/Composer Extraction (Next)
- Extract Modal component from App.jsx
- Extract Composer component
- Extract supporting components (ModalHeader, ModalFooter, etc.)
- Update Modal/Composer to use contexts instead of props

### ⏳ Phase 2.3.4: Testing & Documentation
- Integration testing
- Feature verification
- Component documentation

---

## Problem Analysis

### Current Prop Drilling Issue
```
App.jsx 
├── NotesUI (45 props from App)
│   ├── Modal (30 props from NotesUI)
│   │   ├── Composer (25 props from Modal)
│   │   └── ModalContent (20 props)
│   └── NoteCard (15 props from NotesUI)
└── SettingsUI (25 props from App)
```

**Pain Points:**
- Modal receives 30+ props, only uses 5 directly
- Composer receives 25+ props, only uses 8 directly
- Changes to shared state require prop interface changes
- Hard to test components independently
- Difficult to add new features without adding more props

### Solution: Context API
```
App.jsx
├── AuthContext { currentUser, isAdmin, login, logout }
├── NotesContext { notes, archived, operations... }
├── SettingsContext { preferences, setters... }
├── UIContext { modals, notifications, menus... }
├── ComposerContext { composer state... }
└── ModalContext { modal state... }
```

---

## Context Architecture Design

### 1. AuthContext
**Purpose:** Centralize authentication state (currently in useAuth hook)

**State:**
- `currentUser`: Current logged-in user object
- `isAdmin`: Boolean admin flag
- `token`: JWT token
- `loading`: Auth state loading flag

**Methods:**
- `login(email, password)`: Authenticate user
- `logout()`: Clear session
- `refreshToken()`: Refresh JWT

**Dependencies:** None
**Consumers:** 
- App.jsx (auth shell routing)
- NotesUI (current user context)
- SettingsUI (admin checks)
- Modal (collaboration features)

**Props Before:** None (uses useAuth hook)
**Props After:** {auth, setAuth} as context

**Expected Line Savings:** 20-30 lines

---

### 2. NotesContext
**Purpose:** Centralize notes operations (currently in useNotes hook + App state)

**State:**
- `notes`: Array of regular notes
- `archived`: Array of archived notes
- `loading`: Notes loading state
- `error`: Error message if any

**Methods:**
- `addNote(note)`: Create new note
- `updateNote(id, updates)`: Update note
- `deleteNote(id)`: Delete note
- `archiveNote(id)`: Archive note
- `restoreNote(id)`: Restore note
- `pinNote(id, pinned)`: Toggle pin
- `searchNotes(query)`: Search notes

**Dependencies:** AuthContext (current user)
**Consumers:**
- NotesUI (display notes)
- NoteCard (pin/archive actions)
- Modal (update note)
- Composer (create/save note)
- AdminPanel (bulk operations)

**Props Before:** 15-20 notes-related props
**Props After:** {notes, notesActions} as context

**Expected Line Savings:** 40-60 lines

---

### 3. SettingsContext
**Purpose:** Centralize user preferences (currently in useSettings hook + App state)

**State:**
- `darkMode`: Boolean theme setting
- `accentColor`: String color choice
- `backgroundColor`: String background image
- `cardTransparency`: String transparency level
- `sidebarMinimized`: Boolean sidebar state
- `localAiEnabled`: Boolean AI feature toggle
- `globalTransparency`: String default transparency
- `listView`: Boolean view mode

**Methods:**
- `toggleDarkMode()`: Switch theme
- `setAccentColor(color)`: Update accent
- `setBackgroundImage(image)`: Update background
- `setCardTransparency(level)`: Update transparency
- `toggleSidebar()`: Toggle sidebar
- `toggleAI()`: Toggle AI features

**Dependencies:** None
**Consumers:**
- App.jsx (theme injection)
- All components (dark mode awareness)
- SettingsUI (preference panel)
- NoteCard (transparency)

**Props Before:** 12-15 settings props
**Props After:** {settings, settingsActions} as context

**Expected Line Savings:** 30-50 lines

---

### 4. UIContext
**Purpose:** Centralize UI state (modals, toasts, menus)

**State:**
- `activeModal`: Which modal is open (null, 'note', 'settings', 'admin')
- `modals`: Object containing modal states
- `notifications`: Array of toast notifications
- `menus`: Object containing open menu states
- `sidebarOpen`: Boolean sidebar visibility on mobile

**Methods:**
- `openModal(type, data)`: Open specific modal
- `closeModal()`: Close current modal
- `showNotification(message, type, duration)`: Show toast
- `toggleMenu(name)`: Toggle menu visibility
- `toggleSidebar()`: Toggle sidebar

**Dependencies:** None
**Consumers:**
- App.jsx (modal routing)
- Modal (open/close actions)
- Notifications (toast display)
- Sidebar (menu states)

**Props Before:** 10-15 UI state props
**Props After:** {ui, uiActions} as context

**Expected Line Savings:** 25-35 lines

---

### 5. ComposerContext
**Purpose:** Centralize note composer state (create/edit mode)

**State:**
- `title`: String note title
- `content`: String note content
- `type`: String note type ('text' | 'checklist' | 'draw')
- `color`: String note color
- `items`: Array of checklist items (for checklist type)
- `images`: Array of image objects
- `tags`: Array of tags
- `collapsed`: Boolean collapsed state
- `isDrawing`: Boolean drawing mode flag
- `images`: Array of image data

**Methods:**
- `setTitle(title)`: Update title
- `setContent(content)`: Update content
- `setType(type)`: Change note type
- `setColor(color)`: Change color
- `addItem(text)`: Add checklist item
- `updateItem(id, text, done)`: Update checklist item
- `removeItem(id)`: Remove checklist item
- `addImage(image)`: Add image
- `removeImage(index)`: Remove image
- `addTag(tag)`: Add tag
- `removeTag(tag)`: Remove tag
- `reset()`: Clear all (new note)

**Dependencies:** NotesContext (save operations)
**Consumers:**
- Composer (input fields)
- Modal (composer integration)
- ModalHeader (title display)
- ModalFooter (save button)

**Props Before:** 25-30 composer props
**Props After:** {composer, composerActions} as context

**Expected Line Savings:** 50-80 lines

---

### 6. ModalContext
**Purpose:** Centralize modal state (currently editing note)

**State:**
- `activeId`: String ID of note being edited
- `note`: Full note object
- `originalNote`: Copy for cancel operation
- `isDirty`: Boolean has unsaved changes
- `isSaving`: Boolean save in progress

**Methods:**
- `openNote(id)`: Load note for editing
- `closeNote()`: Close modal
- `resetChanges()`: Discard unsaved changes
- `saveChanges()`: Save and close
- `updateNote(updates)`: Apply changes to current note

**Dependencies:** NotesContext (load/save), AuthContext (user checks)
**Consumers:**
- Modal (main modal state)
- Composer (edit mode)
- ModalHeader (title, unsaved indicator)
- ModalFooter (save button, unsaved state)

**Props Before:** 15-20 modal props
**Props After:** {modal, modalActions} as context

**Expected Line Savings:** 30-50 lines

---

## Implementation Roadmap

### Phase 2.3.1: Foundation Setup
**Time: 1 hour**

1. Create `src/contexts/` folder
2. Create `AuthContext.jsx` (80 lines)
3. Create `NotesContext.jsx` (150 lines)
4. Create `SettingsContext.jsx` (100 lines)
5. Create provider components combining contexts

**Files to Create:**
- `src/contexts/AuthContext.jsx`
- `src/contexts/NotesContext.jsx`
- `src/contexts/SettingsContext.jsx`
- `src/contexts/UIContext.jsx`
- `src/contexts/ComposerContext.jsx`
- `src/contexts/ModalContext.jsx`
- `src/contexts/index.jsx` (re-exports all)

**Validation:**
- Build passes
- No errors importing contexts

---

### Phase 2.3.2: App Integration
**Time: 1.5 hours**

1. Wrap App with context providers
2. Replace all `useAuth` calls with context
3. Replace all `useNotes` calls with context
4. Replace all `useSettings` calls with context
5. Update NotesUI to use contexts

**Changes:**
- App.jsx: Remove useAuth, useNotes imports
- App.jsx: Add context provider setup
- Remove prop drilling from NotesUI signature
- Add useContext calls in components

**Validation:**
- Build passes
- Features still work
- No console errors

---

### Phase 2.3.3: Modal/Composer Refactor
**Time: 1.5 hours**

1. Extract Modal as dedicated component
2. Extract Composer as dedicated component
3. Extract ModalHeader, ModalFooter, ModalContent
4. Update Modal to use ComposerContext and ModalContext
5. Update Composer to use contexts

**Expected Changes:**
- Remove inline Modal function (600+ lines)
- Remove inline Composer function (400+ lines)
- Create `src/components/Modal.jsx`
- Create `src/components/Composer.jsx`
- Create `src/components/ModalHeader.jsx`
- Create `src/components/ModalFooter.jsx`

**Expected Savings:**
- Removed from App.jsx: ~1,000 lines
- Added new component files: ~500 lines
- Net savings: ~500 lines

---

### Phase 2.3.4: Testing & Optimization
**Time: 1 hour**

1. Test all features work correctly
2. Verify no prop drilling remains
3. Check for any missed useContext opportunities
4. Optimize context selectors
5. Document context API usage

---

## Implementation Tasks Breakdown

### Task 1: AuthContext Creation
**File:** `src/contexts/AuthContext.jsx`
**Size Estimate:** 80 lines
**Effort:** 20 minutes

```javascript
// Features:
- useAuth hook integration
- Login/logout methods
- Token refresh
- CurrentUser tracking
- isAdmin flag
```

---

### Task 2: NotesContext Creation
**File:** `src/contexts/NotesContext.jsx`
**Size Estimate:** 150 lines
**Effort:** 30 minutes

```javascript
// Features:
- useNotes hook integration
- CRUD operations
- Search functionality
- Pin/archive operations
- Dual-level caching
```

---

### Task 3: SettingsContext Creation
**File:** `src/contexts/SettingsContext.jsx`
**Size Estimate:** 100 lines
**Effort:** 25 minutes

```javascript
// Features:
- useSettings hook integration
- Theme toggle
- Preference updates
- CSS variable injection
```

---

### Task 4: UIContext + ComposerContext + ModalContext
**Files:** `src/contexts/{UI,Composer,Modal}Context.jsx`
**Size Estimate:** 250 lines
**Effort:** 45 minutes

```javascript
// UIContext: Modals, notifications, menus
// ComposerContext: Note creation state
// ModalContext: Note editing state
```

---

### Task 5: App Integration
**File:** `src/App.jsx`
**Changes:** Provider wrapping, context consumption
**Effort:** 1 hour
**Expected Changes:**
- Add providers around app
- Replace useAuth/useNotes/useSettings with useContext
- Remove props from NotesUI signature
- Update NotesUI to consume contexts

---

### Task 6: Modal Component Extraction
**Files:** 
- `src/components/Modal.jsx` (300 lines)
- `src/components/ModalHeader.jsx` (50 lines)
- `src/components/ModalFooter.jsx` (100 lines)
- `src/components/ModalContent.jsx` (150 lines)
**Effort:** 1.5 hours
**Expected Savings:** 600+ lines from App.jsx

---

## Benefits Summary

### Code Organization
- ✅ Contexts separate concern domains
- ✅ Clear data flow from top to bottom
- ✅ Easy to test components independently
- ✅ Reduced complexity per component

### Maintainability
- ✅ Adding new features doesn't require prop changes
- ✅ Easier to track state mutations
- ✅ Better IDE autocomplete for context methods
- ✅ Clearer dependency relationships

### Performance
- ✅ Potential for context selectors to reduce re-renders
- ✅ Component libraries can be built independently
- ✅ Easier to implement React.memo optimization

### Testing
- ✅ Contexts can be mocked in unit tests
- ✅ Components easier to test in isolation
- ✅ Clear interfaces for integration tests

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Context refactor breaks features | High | Test all features after each context |
| Performance regression | Medium | Monitor re-render counts, use selectors |
| Circular dependencies | Medium | Clear context dependency diagram |
| State consistency | Medium | Thorough testing, log state changes |

---

## Success Criteria

- [x] All 6 contexts created and working
- [ ] App.jsx uses contexts instead of props
- [ ] NotesUI signature reduced from 45 props to <10
- [ ] Modal extracted as separate component
- [ ] Composer extracted as separate component
- [ ] All features still work correctly
- [ ] Build passes with no errors
- [ ] Line count: 5,000-5,300 lines
- [ ] No console warnings or errors

---

## Files to Create/Modify

### New Files (350 lines)
- `src/contexts/AuthContext.jsx` (80 lines)
- `src/contexts/NotesContext.jsx` (150 lines)
- `src/contexts/SettingsContext.jsx` (100 lines)
- `src/contexts/UIContext.jsx` (60 lines)
- `src/contexts/ComposerContext.jsx` (80 lines)
- `src/contexts/ModalContext.jsx` (70 lines)
- `src/contexts/index.jsx` (10 lines)

### Modified Files
- `src/App.jsx` (-1,200 lines)
  - Remove: useAuth, useNotes, useSettings hooks
  - Remove: inline Modal/Composer functions
  - Remove: prop drilling
  - Add: provider setup
  - Add: context consumption

- `src/components/Modal.jsx` (300 lines)
- `src/components/Composer.jsx` (250 lines)
- `src/components/ModalHeader.jsx` (50 lines)
- `src/components/ModalFooter.jsx` (100 lines)

### Components Created (700 lines)
Total: ~700 lines of new components

### Net Line Reduction
- Added new contexts: 350 lines
- Added new components: 700 lines
- Removed from App.jsx: 1,500+ lines
- **Net: -450 to -700 lines**

---

## Phase 2.3 Metrics

| Metric | Current | After Phase 2.3 | Target |
|--------|---------|-----------------|--------|
| App.jsx | 6,573 | 5,300 | 5,000 |
| Total Components | 8 | 13 | 20 |
| Contexts | 0 | 6 | 10 |
| Prop drilling depth | 4 levels | 2 levels | 1 level |
| Complex components | 2 (Modal, Composer) | 1 (ComposerProvider) | 0 |

---

## Ready to Execute

**Prerequisites Met:**
- ✅ Phase 2.2 complete (components extracted)
- ✅ All features working
- ✅ Build clean
- ✅ Architecture documented
- ✅ Roadmap detailed

**Next Action:** Start Phase 2.3.1 (Foundation Setup) when ready

---

**Document Version:** 1.0  
**Created:** January 17, 2026  
**Last Updated:** January 17, 2026 (Initial Creation)
