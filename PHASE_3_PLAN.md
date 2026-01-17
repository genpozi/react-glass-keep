# Phase 3: Performance & Offline Support (Plan)

**Objective**: Transform React Glass Keep into a true "Local-First" Progressive Web App (PWA) that works flawlessly without an internet connection and syncs automatically when back online. Improve rendering performance for large datasets.

## 3.1 Offline Storage Architecture
**Goal**: Replace potential localStorage dependencies and volatile memory cache with persistent IndexedDB.

### Tasks
1. **Choose Library**: Adopt `idb` (lightweight wrapper) or `Dexie.js` (easier API). Recommendation: `Dexie.js`.
2. **Schema Design**:
   - `notes`: { id, title, body, type, tags, color, pinned, archived, timestamps, checksum }
   - `syncKey`: { lastSyncTimestamp }
   - `offlineQueue`: { action, payload, id } (For storing mutations made while offline)
3. **Migration**:
   - Create `src/db.js`.
   - Update `useNotes` and `NotesContext` to read from DB on boot instead of fetching API immediately.
   - API fetch becomes a "background sync" that updates the DB.

## 3.2 Synchronization Engine
**Goal**: Bi-directional syncing between Client (IndexedDB) and Server (SQLite).

### Tasks
1. **Sync Logic**:
   - **Pull**: On load/reconnect, fetch changes since `lastSyncTimestamp`. Update local DB.
   - **Push**: Iterate through `offlineQueue` and POST/PUT to API.
2. **Conflict Resolution**:
   - Implement "Last-Write-Wins" strategy initially based on `updatedAt` ISO timestamps.
   - (Advanced) Field-level merging.
3. **Optimistic Updates**:
   - UI reflects changes immediately (updating local DB).
   - Network request happens in background.
   - Rollback UI if background request fails permanently (not just network error).

## 3.3 UI Performance (Virtualization)
**Goal**: Maintain 60fps scrolling even with 1,000+ notes.

### Tasks
1. **Masonry Grid Virtualization**:
   - Current grid is CSS Masonry (columns).
   - **Challenge**: Virtualizing masonry layouts is hard because height is unknown.
   - **Solution**: Use `react-virtuoso` or implement a "windowing" strategy where only visible notes are rendered, or switch to a fixed-height row view for mobile performance.
2. **Image Optimization**:
   - Implement `IntersectionObserver` for lazy loading images in `NoteCard` (if not already handled by browser native `loading="lazy"`).
   - Ensure thumbnails are used in Grid view, full res only in Modal.
3. **Render Counting**:
   - Audit `NoteCard` re-renders using React DevTools Profiler.
   - Wrap `NoteCard` in `React.memo` with custom comparison function if props (like `onSelect`) are causing unnecessary renders.

## 3.4 Service Worker & PWA Hardening
**Goal**: Ensure the app shell loads instantly.

### Tasks
1. **Cache Strategy**:
   - Verify `vite-plugin-pwa` config.
   - Strategy: `StaleWhileRevalidate` for API GET requests (notes).
   - Strategy: `CacheFirst` for static assets (fonts, icons, backgrounds).
2. **Offline Indicator**:
   - Create a subtle UI banner: "You are offline. Changes saved locally."

## Execution Order
1. **Setup DB**: Install Dexie, define schema.
2. **Read Path**: Make `NotesContext` load from Dexie.
3. **Write Path**: Optimistic updates -> Dexie -> API.
4. **Sync**: Implement background sync on "online" event.
5. **Virtualization**: Optimize the grid.

## Success Metrics
- App loads user notes in < 500ms (from local DB) even on 3G.
- Creating a note works instantly in Airplane Mode.
- Notes sync to server upon reconnection.
- Lighthouse Performance score > 90.
