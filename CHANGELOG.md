# Changelog

## [1.1.0] - 2026-01-18
### Architecture & Modernization
- **Phase 2 Refactoring Complete**: Full architectural overhaul finalized. `App.jsx` reduced from 7,200 lines to <200 lines.
- **Router Pattern**: `App.jsx` now acts solely as a router, switching between `NotesView`, `AdminView`, `AuthViews`, and `SettingsPanel` based on state.
- **Layout Extraction**: Implemented `DashboardLayout` for consistent shell structure (Sidebar + Header) across authenticated views.
- **Component Extraction**: Completed extraction of all functional blocks:
  - `Modal.jsx` & `ModalContext`: Isolated editor logic.
  - `Composer.jsx` & `ComposerContext`: Isolated creation logic.
  - `NotesView.jsx`: Main dashboard logic.
  - `SettingsPanel.jsx`: User preferences UI.
- **Code Reduction**: Total reduction of monolithic code by >90% in the root component.
- **Utility Consolidation**: Centralized 30+ helper functions into `src/utils/helpers.js`.

### Features
- **Enhanced Checklist Editor**: Checklists in the modal now support drag-and-drop reordering.
- **Smart Enter**: Added intelligent "Smart Enter" logic across Modal and Composer for better list and markdown management.
- **Improved Collaboration**: Real-time collaboration logic is now encapsulated in `useCollaboration` and `NotesContext`.

### Security
- Implemented rate limiting on authentication endpoints (10/15min login, 5/1hr recovery).
- Added comprehensive security headers via helmet.js.
- Admin settings persistence to SQLite database.
- Environment variable validation for JWT_SECRET in production.

## [1.0.2] - 2026-01-17
### Added
- **Theme Presets**: Added one-click "Vibes" (Neon Tokyo, Zen Garden, Golden Hour, Deep Space) to instantly configure the workspace appearance.
- **Accent Color System**: Users can now choose from 7 accent colors (Indigo, Rose, Emerald, Amber, Sky, Violet, Neon) to customize buttons, borders, and highlights.
- **Custom Backgrounds**: Users can now select from a library of backgrounds in Settings. Images are optimized for various screen sizes and persisted in local preferences.
- **Theme Overlay**: Option to blend the default app theme gradient over custom background images for better readability and consistent aesthetic.

### Changed
- **Navigation Redesign**: Moved "Settings" and "Admin Panel" links from the Sidebar to a new **User Profile Dropdown** in the header for a cleaner UI.
- **Inline Settings**: The Settings configuration now opens as a full-page inline view (consistent with Admin Panel) instead of a modal dialog.

### Fixed
- **Settings Crash**: Fixed an issue where the Settings view would crash due to missing state propagation (`alwaysShowSidebarOnWide` reference error).
- **Checklist Collaboration**: Improved stability for real-time checklist updates.

## [1.0.1] - 2025-08-15
### Added
- **New Sidebar Admin Panel** (initial release):
  - Create new users directly from the panel.
  - Toggle whether new account sign-ups are allowed.
- **Archiving notes**: move notes to an Archive without deleting them.

### Fixed
- Resolved an issue where typing could unexpectedly scroll the page/editor (“scroll typing”).
