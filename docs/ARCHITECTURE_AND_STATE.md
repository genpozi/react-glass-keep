# Application Architecture & State Logic

## 1. Core Architecture
**React Glass Keep** is a client-side heavy React application that uses `localStorage` for quick persistence and optional server endpoints for AI features.

### File Structure
- **`src/App.jsx`**: The "God Component" that manages 90% of the application state (Authentication, Notes, Search, Sorting, Theming, UI layout).
- **`src/components/DashboardLayout.jsx`**: Layout wrapper handling the sidebar/content grid.
- **`src/themes.js`**: Static definitions for Accents and Theme Presets.
- **`src/backgrounds.js`**: Helper for image path resolution.
- **`src/ai.js`**: Wrapper for interacting with the `/api/ai` endpoint.

---

## 2. State Management & Persistence

The application relies heavily on `localStorage` to persist user preferences and data between sessions.

### LocalStorage Keys
| Key | Type | Description |
| :--- | :--- | :--- |
| `glass_keep_auth` | JSON (Object) | Stores current user profile (`{ name, email, picture }`). Null if logged out. |
| `glass_keep_notes` | JSON (Array) | The main array of user notes. |
| `glass_keep_bg` | String | Filename of the currently selected background (e.g., `"City-Night.jpg"`). |
| `glass_keep_bg_overlay` | Boolean | `true` if the shading overlay is active. |
| `glass_keep_accent` | String (Hex) | The currently selected accent color (e.g., `#6366F1`). |
| `glass_keep_view_mode` | String | `'list'` or `'grid'` for note layout. |

### Theming Engine
The theming system is a hybrid of **React State** and **CSS Variables**.

1. **Initialization (`App.jsx`)**:
   - On mount, `App.jsx` reads `glass_keep_accent` from storage.
   - It applies the color to the document root: `document.documentElement.style.setProperty("--color-accent", color)`.

2. **CSS Layer (`index.css`)**:
   - We define CSS variables for the accent color.
   - We use Tailwind `@theme` to map the `accent` utility classes to these variables.
   
   ```css
   :root {
     --color-accent: #6366F1;
     --color-accent-hover: #4F46E5;
   }
   /* Usage: className="bg-accent text-white" */
   ```

3. **Preset Application (`App.jsx` -> `applyPreset`)**:
   - When a User selects a preset (e.g., "Neon Tokyo"), `App.jsx` batch updates:
     - `background` state -> updates `glass-keep-bg`
     - `backgroundOverlay` state -> updates `glass-keep-bg-overlay`
     - `accentColor` state -> updates CSS variable + `glass_keep_accent`

---

## 3. Asset Pipeline (Backgrounds)
Backgrounds are stored in `public/backgrounds/`. To optimize performance on mobile vs desktop, we use a resolution switching strategy.

### Directory Structure
```
public/backgrounds/
├── original/       # Source high-res files (ignored by git or just for reference)
├── xl/             # 4K optimized (3840px width)
├── desktop/        # 1080p optimized (1920px width)
├── mobile/         # Mobile optimized (800px width)
└── thumb/          # Tiny thumbnails for the settings grid (200px width)
```
*Note: The `backgrounds.js` helper `getBgUrl(filename, type)` automatically resolves the correct path based on the requested type.*

---

## 4. Known Dependencies & Quirks
- **Marked**: Used for Markdown rendering in notes. Imported conditionally in `App.jsx` to handle ESM/CommonJS quirks.
- **Masonry Layout**: The dashboard uses a CSS-only masonry approach (or `column-count`) for the grid view.
- **AI Sidebar**: Toggling `isAISidebarOpen` squeezes the main content. This logic handles window resizing events to auto-collapse on mobile.
