# Application Architecture & State Logic

## 1. Modular Architecture
**React Glass Keep** operates on a fully modular, Context-driven architecture. The codebase has moved away from a monolithic structure to a separation of concerns between Routing, Views, Layouts, and State.

### Core Structure
- **Root Entry (`App.jsx`)**: Acts as the high-level router and provider shell. It listens to authentication state and hash routes to switch between top-level views (`NotesView`, `AdminView`, `LoginView`, `RegisterView`).
- **`src/contexts/`**: Centralized state management.
  - `AuthContext`: Authentication, session management (JWT), and user profiles.
  - `NotesContext`: Note CRUD, search, filtering, and real-time SSE syncing.
  - `ModalContext`: Complex state machine for the note editor modal (formerly ~1000 lines of App code).
  - `ComposerContext`: Logic for creating new notes.
  - `UIContext`: Global UI shells (Toasts, Confirmation Dialogs).
  - `SettingsContext`: User preferences (Theming, View Modes).

- **`src/components/`**: 
  - **Views**: Top-level route targets.
    - `NotesView.jsx`: The main dashboard displaying note grids/lists.
    - `AdminView.jsx`: User management and system stats.
    - `AuthViews.jsx`: Login/Register forms.
  - **Layout**: 
    - `DashboardLayout.jsx`: The application shell containing the `Sidebar` and `SearchBar`.
  - **Widgets**: `NoteCard.jsx`, `Composer.jsx`, `SettingsPanel.jsx`.

- **`src/utils/helpers.js`**: Pure utility functions for API calls, formatting, and image processing.

---

## 2. State Management & Persistence

The application uses **React Context** as its primary state engine, with persistence layers for both `localStorage` and a remote SQLite backend.

### Context Flow
1. **Providers**: Wrapped at the root in `main.jsx` via `RootProvider`.
2. **Persistence**:
   - `SettingsContext` persists themes and UI preferences to `localStorage`.
   - `NotesContext` syncs note data with the backend `/api/notes` with a local cache fallback.
   - `AuthContext` manages JWT tokens in `localStorage`.

### Data Syncing (SSE)
Real-time collaboration is handled via **Server-Sent Events (SSE)**.
- The `useCollaboration` hook (used by `NotesContext`) listens for `note_updated` events.
- When an update occurs, the local `NotesContext` invalidates its cache and re-fetches data, ensuring all users see changes instantly.

---

## 3. Theming Engine
The theming system is a hybrid of **React State** and **Tailwind CSS / Variables**.

1. **Context Management (`SettingsContext`)**:
   - Manages `accentColor`, `dark` mode, and `backgroundImage`.
   - Dynamically updates the `:root` CSS variables on change.

2. **CSS Layer (`index.css`)**:
   - Tailwind utilities are mapped to `--color-accent` and `--bg-accent`.

---

## 4. Utility Architecture
Heavy logic is moved out of components into `src/utils/helpers.js`:
- **API Wrapper**: A centralized `api()` fetch helper handles timeouts, error parsing, and automatic logout on 401s.
- **Formatting**: `runFormat()` manages markdown injection into textareas.
- **Checklist Logic**: Universal item toggling and reordering helpers.
- **Image Pipeline**: Handles DataURL compression and filename normalization before upload.

---

## 5. Directory Structure
```
src/
├── components/     # UI Components (Presentational + Logic)
├── contexts/      # State Management (Providers + Hooks)
├── hooks/         # Custom React Hooks (Collaboration, Admin)
├── utils/         # Pure functions and helpers
└── ai.js          # AI logic wrapper
```
