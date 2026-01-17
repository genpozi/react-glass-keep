# Feature: Advanced Theming System

## Overview
Transform the application from a static design to a fully customizable personalized workspace. This involves moving beyond simple background selection to a holistic "Theme" system that coordinates Backgrounds, Accent Colors, and UI Textures.

## Research Findings (2024/2025 Design Trends)
- **Holo-Glass**: Evolved glassmorphism uses saturation boosts and noise textures.
- **Bioluminescent Accents**: Dark mode requires "emitting" colors (Neon Pink, Cyan, Amber) rather than standard print colors.
- **Presets vs Settings**: Users prefer "Vibes" (Presets) over granular settings rows.

## Template Inspirations (Presets)
We will implement the following presets based on our research and existing assets:

### 1. **Neon Tokyo (Cyberpunk)**
- **Background**: `City-Night.png` or `Rain-City.png`
- **Accent**: Neon Pink (`#F472B6`) or Cyber Blue (`#06B6D4`)
- **Vibe**: High contrast, tech-focused, sharp.

### 2. **Zen Garden (Eco)**
- **Background**: `Bonsai-Plant.png` or `Dark_Nature.png`
- **Accent**: Emerald Green (`#34D399`)
- **Vibe**: Calming, organic, soft blur.

### 3. **Golden Hour**
- **Background**: `Fantasy - Sunset.png`
- **Accent**: Amber (`#F59E0B`)
- **Vibe**: Warm, nostalgic, cozy.

### 4. **Deep Space (Default)**
- **Background**: Default Gradient or `Anime-Girl-Night-Sky.jpg`
- **Accent**: Indigo (`#6366F1`)
- **Vibe**: Focus, classic, reliable.

## Technical Plan

### 1. CSS Variable Architecture
Refactor hardcoded Tailwind classes (e.g., `bg-indigo-600`) to dynamic CSS variables.
```css
:root {
  --color-accent: #6366F1; /* Default Indigo */
  --bg-overlay-opacity: 0.85;
}
/* Tailwind Usage */
.bg-accent { background-color: var(--color-accent); }
```

### 2. Accent Color Palette
Define a curated list of selectable accent colors:
- **Indigo** (Default): `#6366F1`
- **Rose** (Pink/Red): `#F43F5E`
- **Emerald** (Green): `#10B981`
- **Amber** (Orange): `#F59E0B`
- **Sky** (Blue): `#0EA5E9`
- **Violet** (Purple): `#8B5CF6`

### 3. Theme Data Structure
```javascript
{
  id: "neon-tokyo",
  name: "Neon Tokyo",
  backgroundId: "City-Night.png",
  accentColor: "#F472B6", // Rose
  overlayEnabled: true
}
```

### 4. UI Implementation
- **Theme Picker**: A new top-level section in Settings > Appearance.
- **Quick Presets**: A horizontal scroll of "Theme Cards" (Preset Previews).
- **Studio Mode**: The existing Background Grid + New Accent Color Dots.

## Current Status
- [x] Background System (Images & Overlay)
- [x] CSS Variable Architecture (Refactored hardcoded colors to `var(--color-accent)`)
- [x] UI: Accent Color Picker (Implemented in Settings)
- [x] UI: Theme Presets (Implemented in Settings > Appearance)

## Implementation Details
- **Accent System**:
    - `src/themes.js` defines the palette.
    - `App.jsx` syncs `localStorage` state to `:root` CSS variables.
    - `index.css` maps Tailwind `@theme` colors to these variables.
    - Extensive refactor of `indigo-600` et al to `accent` utilities.
- **Theme Presets**:
    - One-click configuration of Background, Accent, and Overlay.
    - Visual "Cards" displaying the vibe.
    - State is still granular, meaning users can apply a preset and then tweak it (e.g., select "Neon Tokyo" then change the accent to Amber).




