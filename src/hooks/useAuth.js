import { useState, useEffect, useCallback } from 'react';

const AUTH_KEY = 'glass-keep-auth';

/**
 * useAuth Hook
 * Manages authentication state and operations (login, register, logout, etc.)
 * Persists auth to localStorage
 */
export function useAuth() {
  // Auth helpers
  const getAuth = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
    } catch (e) {
      return null;
    }
  }, []);

  const setAuthStorage = useCallback((obj) => {
    if (obj) localStorage.setItem(AUTH_KEY, JSON.stringify(obj));
    else localStorage.removeItem(AUTH_KEY);
  }, []);

  // State
  const [session, setSession] = useState(getAuth());
  const token = session?.token;
  const currentUser = session?.user || null;
  const isAdmin = !!currentUser?.is_admin;

  // Persist session to localStorage
  useEffect(() => {
    setAuthStorage(session);
  }, [session, setAuthStorage]);

  // Handle auth expiration globally
  useEffect(() => {
    const handleAuthExpired = () => {
      console.log("Auth expired, signing out...");
      setSession(null);
      setAuthStorage(null);
      // Clear all cached data
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('glass-keep-')) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.error("Error clearing cache on auth expiration:", error);
      }
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, [setAuthStorage]);

  // Logout
  const logout = useCallback(() => {
    setSession(null);
    setAuthStorage(null);
  }, [setAuthStorage]);

  // Update session (called after login/register)
  const updateSession = useCallback((authData) => {
    setSession(authData);
  }, []);

  return {
    session,
    token,
    currentUser,
    isAdmin,
    updateSession,
    logout,
    getAuth,
    setAuthStorage,
  };
}
