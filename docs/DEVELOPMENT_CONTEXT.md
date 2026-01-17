# Development Context (Current State)

**Last Updated:** January 17, 2026 (Agent Session)

## Recent Major Changes
We have just completed a significant overhaul of the UI visualization layer ("Advanced Theming").

### Completed Features
1. **Crash Fix in NotesUI**: Fixed a `ReferenceError` where `alwaysShowSidebarOnWide` was being accessed improperly.
2. **Dynamic Backgrounds**: 
   - Replaced static `bg-gray-900` with transparent UI layers.
   - Implemented `NotesUI` absolute positioning to allow the `img` background to sit behind the content.
3. **Accent Color System**:
   - Refactored ~50 instances of `indigo-600`, `indigo-500`, etc., to use generic `accent` utility classes.
   - This allows the entire app's color scheme to change instantly via CSS variables.
4. **Theme Presets ("Vibes")**:
   - Added logic in `SettingsPanel` to apply grouped settings (BG + Overlay + Color) in one click.

## Fragile Areas / Watch List
- **Background Image Loading**: Large images might flash white/black on slow connections before loading. A preloader or blur-hash placeholder has NOT been implemented yet.
- **Text Contrast**: While `backgroundOverlay` helps, some very busy user-uploaded backgrounds might still make text hard to read. The "Shade Overlay" is the current mitigation.
- **Tailwind v4 / CSS Config**: We are using some custom CSS variable mappings. If `index.css` is refactored, ensure the `:root` variable definitions remain compatible with the JavaScript injection logic in `App.jsx`.

## How to Continue Development

### Adding New Presets
1. Open `src/themes.js`.
2. Add a new object to the `THEME_PRESETS` array.
   ```javascript
   {
     id: "new-theme",
     name: "New Theme Name",
     backgroundId: "existing-image.jpg",
     accentColor: ACCENT_COLORS.find(c => c.name === 'SomeColor').value,
     overlayEnabled: true
   }
   ```
3. No other code changes needed; `SettingsPanel` renders this list dynamically.

### Adding New Backgrounds
1. Place the high-res image in `public/backgrounds/original/`.
2. Run the optimization script (if available) or manually create resized versions in `desktop/`, `mobile/`, and `thumb/`.
3. Add the filename to `BACKGROUNDS` in `src/backgrounds.js`.

### Modifying Accent Colors
1. Open `src/themes.js`.
2. Add a new color definition to `ACCENT_COLORS`. 
   - Note: You do NOT need to update CSS. The app injects the hex code directly into `--color-accent`.

## Next Recommended Steps (Backlog)
- **User Uploads**: Allow users to upload their own background images (store in `localStorage` as Base64? Or IndexedDB?).
- **Font Selection**: Similar to Accent Colors, allow picking Serif/Sans/Monospace fonts.
- **Glass Blur Slider**: Allow users to adjust the `backdrop-blur` intensity of the note cards.
