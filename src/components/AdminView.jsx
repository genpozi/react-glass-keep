import React, { useState, useEffect } from 'react';
import { useAuth, useSettings, useUI } from '../contexts';
import { api } from '../utils/helpers';

export default function AdminView() {
  const { dark } = useSettings();
  const { currentUser } = useAuth();
  const { showGenericConfirm } = useUI(); // Ensure UIContext provides this
  const token = currentUser?.token;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const formatBytes = (n = 0) => {
    if (!Number.isFinite(n) || n <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const e = Math.min(Math.floor(Math.log10(n) / 3), units.length - 1);
    const v = n / Math.pow(1024, e);
    return `${v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2)} ${units[e]}`;
  };

  async function load() {
    setLoading(true);
    try {
      // Using api helper which handles /api prefix if needed, or we assume path is relative
      const data = await api('/admin/users', { token });
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      alert(e.message || "Failed to load admin data");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  async function removeUser(id) {
    try {
      await api(`/admin/users/${id}`, {
        method: "DELETE",
        token
      });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      alert(e.message || "Delete failed");
    }
  }

  useEffect(() => { load(); }, []); // load once

  return (
    <div className="min-h-screen px-4 sm:px-6 md:px-8 lg:px-12 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Admin</h1>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
          Manage registered users. You can remove users (this also deletes their notes).
        </p>

        <div className="glass-card rounded-xl p-4 shadow-lg overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Users</h2>
            <button
              onClick={load}
              className="px-3 py-1.5 rounded-lg border border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/10 text-sm"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-[var(--border-light)]">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Email / Username</th>
                <th className="py-2 pr-3">Notes</th>
                <th className="py-2 pr-3">Storage</th>
                <th className="py-2 pr-3">Admin</th>
                <th className="py-2 pr-3">Created</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500 dark:text-gray-400">
                    No users found.
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[var(--border-light)] last:border-0">
                  <td className="py-2 pr-3">{u.name}</td>
                  <td className="py-2 pr-3">{u.email}</td>
                  <td className="py-2 pr-3">{u.notes ?? 0}</td>
                  <td className="py-2 pr-3">{formatBytes(u.storage_bytes ?? 0)}</td>
                  <td className="py-2 pr-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_admin
                        ? "bg-green-500/15 text-green-700 dark:text-green-300 border border-green-500/30"
                        : "bg-gray-500/10 text-gray-700 dark:text-gray-300 border border-gray-500/20"
                        }`}
                    >
                      {u.is_admin ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    {new Date(u.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-3">
                    <button
                      className="px-2.5 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
                      onClick={() => {
                        // If showGenericConfirm is available, use it. Else window.confirm.
                        if (showGenericConfirm) {
                          showGenericConfirm({
                            title: "Delete User",
                            message: "Delete this user and ALL their notes? This cannot be undone.",
                            confirmText: "Delete",
                            danger: true,
                            onConfirm: () => removeUser(u.id)
                          });
                        } else {
                          if (window.confirm("Delete this user and ALL their notes?")) {
                            removeUser(u.id);
                          }
                        }
                      }}
                      title="Delete user"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading && (
            <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading…</div>
          )}
        </div>
      </div>
    </div>
  );
}
