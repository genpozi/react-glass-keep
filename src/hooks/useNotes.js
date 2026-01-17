import { useState, useCallback, useEffect } from 'react';

const NOTES_CACHE_KEY = "glass-keep-notes-";
const ARCHIVED_NOTES_CACHE_KEY = "glass-keep-archived-notes-";
const CACHE_TIMESTAMP_KEY = "glass-keep-notes-cache-timestamp";

/**
 * useNotes Hook
 * Manages notes state and operations
 * Handles loading, caching, and basic CRUD operations
 */
export function useNotes(token, userId) {
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(`/api${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.status === 204) return null;
      let data = null;
      try {
        data = await res.json();
      } catch (e) {
        data = null;
      }

      if (res.status === 401) {
        window.dispatchEvent(new CustomEvent('auth-expired'));
        const err = new Error(data?.error || "Session expired");
        err.status = res.status;
        err.isAuthError = true;
        throw err;
      }

      if (!res.ok) {
        const err = new Error(data?.error || `HTTP ${res.status}`);
        err.status = res.status;
        throw err;
      }
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        const err = new Error("Request timeout");
        err.status = 408;
        throw err;
      }
      throw error;
    }
  }, []);

  // Cache helpers
  const getCacheKey = useCallback(() => NOTES_CACHE_KEY + userId, [userId]);
  const getArchivedCacheKey = useCallback(() => ARCHIVED_NOTES_CACHE_KEY + userId, [userId]);

  const persistNotesCache = useCallback((notesArray) => {
    try {
      localStorage.setItem(getCacheKey(), JSON.stringify(notesArray));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (e) {
      console.error("Error caching notes:", e);
    }
  }, [getCacheKey]);

  const invalidateNotesCache = useCallback(() => {
    try {
      localStorage.removeItem(getCacheKey());
      localStorage.removeItem(getArchivedCacheKey());
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    } catch (e) {
      console.error("Error invalidating cache:", e);
    }
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
      console.error("Error loading notes:", error);
      // Fallback to cache
      try {
        const cachedData = localStorage.getItem(getCacheKey());
        if (cachedData) {
          setNotes(sortNotesByRecency(JSON.parse(cachedData)));
        } else {
          setNotes([]);
        }
      } catch (cacheError) {
        console.error("Error loading from cache:", cacheError);
        setNotes([]);
      }
    } finally {
      setNotesLoading(false);
    }
  }, [token, api, sortNotesByRecency, persistNotesCache, getCacheKey]);

  // Load archived notes
  const loadArchivedNotes = useCallback(async () => {
    if (!token) return;
    setNotesLoading(true);

    let hasCachedData = false;
    try {
      const cachedData = localStorage.getItem(getArchivedCacheKey());
      if (cachedData) {
        setNotes(sortNotesByRecency(JSON.parse(cachedData)));
        hasCachedData = true;
      }
    } catch (cacheError) {
      console.error("Error loading archived notes from cache:", cacheError);
    }

    try {
      const data = await api("/notes/archived", { token });
      const notesArray = Array.isArray(data) ? data : [];
      setNotes(sortNotesByRecency(notesArray));
      
      try {
        localStorage.setItem(getArchivedCacheKey(), JSON.stringify(notesArray));
      } catch (error) {
        console.error("Error caching archived notes:", error);
      }
    } catch (error) {
      console.error("Error loading archived notes:", error);
      if (!hasCachedData) {
        setNotes([]);
      }
    } finally {
      setNotesLoading(false);
    }
  }, [token, api, sortNotesByRecency, getArchivedCacheKey]);

  // Archive/unarchive note
  const toggleArchiveNote = useCallback(async (noteId, archived) => {
    try {
      await api(`/notes/${noteId}/archive`, { method: "POST", token, body: { archived } });
      invalidateNotesCache();
      
      if (tagFilter === 'ARCHIVED') {
        if (!archived) {
          setTagFilter(null);
          return await loadNotes();
        } else {
          return await loadArchivedNotes();
        }
      } else {
        return await loadNotes();
      }
    } catch (e) {
      throw e;
    }
  }, [token, api, tagFilter, invalidateNotesCache, loadNotes, loadArchivedNotes]);

  // Delete note
  const deleteNote = useCallback(async (noteId) => {
    try {
      await api(`/notes/${noteId}`, { method: "DELETE", token });
      setNotes(prev => prev.filter(n => String(n.id) !== String(noteId)));
      invalidateNotesCache();
    } catch (e) {
      throw e;
    }
  }, [token, api, invalidateNotesCache]);

  // Reorder notes
  const reorderNotes = useCallback(async (noteIds) => {
    try {
      await api("/notes/reorder", {
        method: "POST",
        token,
        body: { positions: noteIds.map((id, idx) => ({ id, position: noteIds.length - idx })) }
      });
      invalidateNotesCache();
    } catch (e) {
      throw e;
    }
  }, [token, api, invalidateNotesCache]);

  return {
    notes,
    setNotes,
    notesLoading,
    search,
    setSearch,
    tagFilter,
    setTagFilter,
    loadNotes,
    loadArchivedNotes,
    toggleArchiveNote,
    deleteNote,
    reorderNotes,
    invalidateNotesCache,
    persistNotesCache,
    sortNotesByRecency,
  };
}
