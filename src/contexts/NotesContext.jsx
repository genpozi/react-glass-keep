import React, { createContext, useState, useCallback, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { useCollaboration } from '../hooks/useCollaboration';

export const NotesContext = createContext();

const NOTES_CACHE_KEY = "glass-keep-notes-";
const ARCHIVED_NOTES_CACHE_KEY = "glass-keep-archived-notes-";
const CACHE_TIMESTAMP_KEY = "glass-keep-notes-cache-timestamp";

/**
 * NotesProvider Component
 * Provides notes state and operations to the entire app
 */
export function NotesProvider({ children }) {
  const authContext = useContext(AuthContext);
  const token = authContext?.token;
  const currentUser = authContext?.currentUser;
  const userId = currentUser?.id;
  
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState(null);

  // Helper to sort notes by recency
  const sortNotesByRecency = useCallback((arr) => {
    if (!Array.isArray(arr)) return [];
    return [...arr].sort((a, b) => {
      const aPos = a.position !== undefined ? a.position : a.timestamp;
      const bPos = b.position !== undefined ? b.position : b.timestamp;
      return (bPos || 0) - (aPos || 0);
    });
  }, []);

  // API helper
  const api = useCallback(async (path, { method = "GET", body, token: authToken } = {}) => {
    const headers = { "Content-Type": "application/json" };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;

    try {
      const res = await fetch(`/api${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (res.status === 204) return null;
      let data = null;
      try { data = await res.json(); } catch (e) { data = null; }

      if (res.status === 401) {
        window.dispatchEvent(new CustomEvent('auth-expired'));
      }

      if (!res.ok) {
        const err = new Error(data?.error || `HTTP ${res.status}`);
        err.status = res.status;
        throw err;
      }
      return data;
    } catch (error) {
      throw error;
    }
  }, []);

  // Cache helpers
  const getCacheKey = useCallback(() => NOTES_CACHE_KEY + (userId || 'anon'), [userId]);
  const getArchivedCacheKey = useCallback(() => ARCHIVED_NOTES_CACHE_KEY + (userId || 'anon'), [userId]);

  const persistNotesCache = useCallback((notesArray) => {
    try {
      localStorage.setItem(getCacheKey(), JSON.stringify(notesArray));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (e) { }
  }, [getCacheKey]);

  const invalidateNotesCache = useCallback(() => {
    try {
      localStorage.removeItem(getCacheKey());
      localStorage.removeItem(getArchivedCacheKey());
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    } catch (e) { }
  }, [getCacheKey, getArchivedCacheKey]);

  // Load notes
  const loadNotes = useCallback(async () => {
    if (!token) return;
    setNotesLoading(true);
    try {
      const data = await api("/notes", { token });
      const notesArray = Array.isArray(data) ? data : [];
      setNotes(sortNotesByRecency(notesArray));
      persistNotesCache(notesArray);
    } catch (error) {
      const cached = localStorage.getItem(getCacheKey());
      if (cached) setNotes(sortNotesByRecency(JSON.parse(cached)));
    } finally {
      setNotesLoading(false);
    }
  }, [token, api, sortNotesByRecency, persistNotesCache, getCacheKey]);

  // Load archived notes
  const loadArchivedNotes = useCallback(async () => {
    if (!token) return;
    setNotesLoading(true);
    try {
      const data = await api("/notes/archived", { token });
      const notesArray = Array.isArray(data) ? data : [];
      setNotes(sortNotesByRecency(notesArray));
      localStorage.setItem(getArchivedCacheKey(), JSON.stringify(notesArray));
    } catch (error) {
      const cached = localStorage.getItem(getArchivedCacheKey());
      if (cached) setNotes(sortNotesByRecency(JSON.parse(cached)));
    } finally {
      setNotesLoading(false);
    }
  }, [token, api, sortNotesByRecency, getArchivedCacheKey]);

  // SSE Collaboration
  const { sseConnected, isOnline } = useCollaboration({
    token,
    tagFilter,
    onNotesUpdated: loadNotes
  });

  // Note operations
  const toggleArchiveNote = useCallback(async (noteId, archived) => {
    await api(`/notes/${noteId}/archive`, { method: "POST", token, body: { archived } });
    invalidateNotesCache();
    if (tagFilter === 'ARCHIVED') {
      await loadArchivedNotes();
    } else {
      await loadNotes();
    }
  }, [token, api, tagFilter, invalidateNotesCache, loadNotes, loadArchivedNotes]);

  const deleteNote = useCallback(async (noteId) => {
    await api(`/notes/${noteId}`, { method: "DELETE", token });
    setNotes(prev => prev.filter(n => String(n.id) !== String(noteId)));
    invalidateNotesCache();
  }, [token, api, invalidateNotesCache]);

  const createNote = useCallback(async (noteData) => {
    const created = await api("/notes", { method: "POST", body: noteData, token });
    setNotes((prev) => sortNotesByRecency([created, ...(Array.isArray(prev) ? prev : [])]));
    invalidateNotesCache();
    return created;
  }, [token, api, sortNotesByRecency, invalidateNotesCache]);

  const togglePin = useCallback(async (id, toPinned) => {
    await api(`/notes/${id}`, { method: "PATCH", token, body: { pinned: !!toPinned } });
    invalidateNotesCache();
    setNotes((prev) => prev.map((n) => (String(n.id) === String(id) ? { ...n, pinned: !!toPinned } : n)));
  }, [token, api, invalidateNotesCache]);

  const updateChecklistItem = useCallback(async (noteId, itemId, checked) => {
    // Find the note
    const note = notes.find(n => String(n.id) === String(noteId));
    if (!note) return;

    // Optimistically update the note
    const updatedItems = (note.items || []).map(item =>
      item.id === itemId ? { ...item, done: checked } : item
    );
    const updatedNote = { ...note, items: updatedItems };

    // Update local state optimistically
    setNotes(prev => prev.map(n =>
      String(n.id) === String(noteId) ? updatedNote : n
    ));

    try {
      // Update on server
      await api(`/notes/${noteId}`, {
        method: "PATCH",
        token,
        body: { items: updatedItems, type: "checklist", content: "" }
      });

      // Invalidate caches since we modified the note
      invalidateNotesCache();
      invalidateArchivedNotesCache();
    } catch (error) {
      console.error("Failed to update checklist item:", error);
      // Revert the optimistic update on error (simplified)
      loadNotes().catch(() => {});
    }
  }, [token, api, notes, loadNotes, invalidateNotesCache, invalidateArchivedNotesCache]);

  const reorderNotes = useCallback(async (noteIds) => {
    await api("/notes/reorder", {
      method: "POST",
      token,
      body: { positions: noteIds.map((id, idx) => ({ id, position: noteIds.length - idx })) }
    });
    invalidateNotesCache();
  }, [token, api, invalidateNotesCache]);

  const value = {
    notes, setNotes, notesLoading, search, setSearch, tagFilter, setTagFilter,
    loadNotes, loadArchivedNotes, toggleArchiveNote, deleteNote, createNote, 
    updateChecklistItem, togglePin, reorderNotes,
    invalidateNotesCache, sseConnected, isOnline
  };

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) throw new Error('useNotes must be used within NotesProvider');
  return context;
}
