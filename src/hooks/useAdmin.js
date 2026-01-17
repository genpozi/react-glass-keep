import { useState, useCallback } from 'react';

/**
 * useAdmin Hook
 * Manages admin panel operations: settings, user management, etc.
 */
export function useAdmin(token) {
  const [adminSettings, setAdminSettings] = useState({ allowNewAccounts: true });
  const [allUsers, setAllUsers] = useState([]);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', is_admin: false });

  const API_BASE = "/api";

  // Helper function to make API calls
  const api = async (path, { method = "GET", body, token: apiToken } = {}) => {
    const headers = { "Content-Type": "application/json" };
    if (apiToken) headers.Authorization = `Bearer ${apiToken}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(`${API_BASE}${path}`, {
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
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }

      if (!res.ok) {
        if (res.status === 401) {
          const e = new Error("Session expired");
          e.status = 401;
          window.dispatchEvent(new CustomEvent("auth-expired"));
          throw e;
        }
        throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
      }

      return data;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Request timeout");
      }
      throw error;
    }
  };

  const loadAdminSettings = useCallback(async () => {
    try {
      console.log("Loading admin settings...");
      const settings = await api("/admin/settings", { token });
      console.log("Admin settings loaded:", settings);
      setAdminSettings(settings);
      return settings;
    } catch (e) {
      console.error("Failed to load admin settings:", e);
      throw e;
    }
  }, [token]);

  const updateAdminSettings = useCallback(async (newSettings) => {
    try {
      const settings = await api("/admin/settings", { method: "PATCH", token, body: newSettings });
      setAdminSettings(settings);
      return settings;
    } catch (e) {
      console.error("Failed to update admin settings:", e);
      throw e;
    }
  }, [token]);

  const loadAllUsers = useCallback(async () => {
    try {
      console.log("Loading all users...");
      const users = await api("/admin/users", { token });
      console.log("Users loaded:", users);
      setAllUsers(users);
      return users;
    } catch (e) {
      console.error("Failed to load users:", e);
      throw e;
    }
  }, [token]);

  const createUser = useCallback(async (userData) => {
    try {
      const newUser = await api("/admin/users", { method: "POST", token, body: userData });
      setAllUsers(prev => [newUser, ...prev]);
      setNewUserForm({ name: '', email: '', password: '', is_admin: false });
      return newUser;
    } catch (e) {
      console.error("Failed to create user:", e);
      throw e;
    }
  }, [token]);

  const deleteUser = useCallback(async (userId) => {
    try {
      await api(`/admin/users/${userId}`, { method: "DELETE", token });
      setAllUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e) {
      console.error("Failed to delete user:", e);
      throw e;
    }
  }, [token]);

  const updateUser = useCallback(async (userId, userData) => {
    try {
      const updatedUser = await api(`/admin/users/${userId}`, { method: "PATCH", token, body: userData });
      setAllUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      return updatedUser;
    } catch (e) {
      console.error("Failed to update user:", e);
      throw e;
    }
  }, [token]);

  const loadAdminPanel = useCallback(async () => {
    console.log("Loading admin panel data...");
    try {
      await Promise.all([
        loadAdminSettings(),
        loadAllUsers()
      ]);
      console.log("Admin panel data loaded successfully");
    } catch (error) {
      console.error("Error loading admin panel data:", error);
      throw error;
    }
  }, [loadAdminSettings, loadAllUsers]);

  return {
    // State
    adminSettings,
    allUsers,
    newUserForm,
    setNewUserForm,

    // Admin settings
    loadAdminSettings,
    updateAdminSettings,

    // User management
    loadAllUsers,
    createUser,
    deleteUser,
    updateUser,

    // Bulk operations
    loadAdminPanel,
  };
}
