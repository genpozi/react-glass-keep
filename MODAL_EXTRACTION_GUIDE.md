Maplewood2025
# Phase 2.3.3 Implementation Guide: Modal & Composer Extraction

**Current State:**
- App.jsx: 6,574 lines
- Modal JSX: Lines 5257-6243 (986 lines)
- Modal state variables: 30+ variables scattered in App.jsx
- Modal functions: openModal, closeModal, saveModal, etc.

**Extraction Strategy:**

## Step 1: Create Modal Wrapper Component (Recommended First Step)

Create `/src/components/Modal.jsx` that accepts props and uses ModalContext internally.

This component would:
- Take core modal props (open, activeId, note data)
- Use ModalContext for state management
- Internally use useComposer for composer state
- Handle all modal rendering logic
- Reduce App.jsx by ~986 lines

## Step 2: Move Modal State to ModalContext

Update ModalContext to include:
- mType, mTitle, mBody, mTagList, mColor, mTransparency
- All modal handlers: saveModal, deleteModal, etc.
- All modal UI state: viewMode, showComposerFmt, etc.

## Step 3: Create Composer as Sub-Component

Create `/src/components/Composer.jsx` that:
- Uses ComposerContext for state
- Handles all composer input logic
- Rendered inside Modal

## Step 4: Update App.jsx

Replace:
```jsx
const modal = open && (...)
```

With:
```jsx
const modal = open && <Modal />
```

## Expected Reduction

- Modal JSX moved: 986 lines
- Modal state simplified: 100+ lines
- Total reduction: ~700-800 lines

**Remaining in App.jsx: 5,800-5,900 lines**

## Implementation Priority

The most impactful first step would be:
1. Create Modal.jsx wrapper (takes ~30-45 minutes)
2. Update ModalContext to centralize modal state
3. Extract Composer.jsx (takes ~20 minutes)
4. Update App.jsx to use <Modal /> component

This approach:
✅ Maintains functionality
✅ Makes incremental progress
✅ Reduces prop drilling
✅ Tests well in isolation
✅ Easier to debug than large refactors

---

**Recommended:** Start with creating Modal.jsx wrapper component
**Estimated completion:** 1-2 hours for full Phase 2.3.3
