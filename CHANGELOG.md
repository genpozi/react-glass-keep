# Changelog

## [Unreleased] - In Development
### Architecture & Refactoring
- **Phase 2.1 Complete**: Extracted 5 custom React hooks (891 lines) for better code organization
  - useAuth, useNotes, useSettings, useCollaboration, useAdmin
  - Eliminated 700+ lines of duplicate code
  - Full integration with zero breaking changes
- **Phase 2.2 In Progress**: UI component extraction
  - Created SearchBar component (50 lines) - Ready for integration
  - Created NoteCard component (280 lines) - Ready for integration
  - Identified 1,300+ line Modal component for Phase 2.3
  - Deferred complex components to enable proper Context API first
- **Phase 2.3 Planned**: React Context API for state management
  - Will create 6 contexts (Auth, Notes, Settings, UI, Composer, Modal)
  - Will eliminate prop drilling across 10+ component levels
  - Will enable proper Modal/Composer component extraction

### Security
- Implemented rate limiting on authentication endpoints (10/15min login, 5/1hr recovery)
- Added comprehensive security headers via helmet.js
- Admin settings persistence to SQLite database
- Environment variable validation for JWT_SECRET in production
- Global auth expiration event handling

### Performance
- Improved build time: 3.5s → 2.6s (23% improvement)
- Bundle size stable at 120 KB gzip
- 1682 modules in clean build state

### Development
- Zero regressions in existing features
- All tests passing
- Clean git history with descriptive commits
- Comprehensive documentation added

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
