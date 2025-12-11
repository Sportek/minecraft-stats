"use client";

import { useAuth } from "@/contexts/auth";
import { getAdminUsers, updateUserRole } from "@/http/user";
import { User } from "@/types/auth";
import { Search, Shield, ShieldCheck, UserIcon } from "lucide-react";
import { useEffect, useState } from "react";

const AdminUsersPage = () => {
  const { user, getToken } = useAuth();
  const token = getToken();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "writer" | "user">("all");
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await getAdminUsers(token, 1, 100, search, roleFilter);
        setUsers(response.data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounce);
  }, [token, search, roleFilter]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-slate-400">You must be an administrator to access this page.</p>
        </div>
      </div>
    );
  }

  const handleRoleChange = async (userId: number, newRole: "admin" | "writer" | "user") => {
    if (!token) return;

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    if (targetUser.id === user.id) {
      alert("You cannot change your own role.");
      return;
    }

    const confirmMessage =
      newRole === "admin"
        ? `Are you sure you want to make ${targetUser.username} an admin? They will have full access to the platform.`
        : `Are you sure you want to change ${targetUser.username}'s role to ${newRole}?`;

    if (!confirm(confirmMessage)) return;

    try {
      setUpdatingUserId(userId);
      const updatedUser = await updateUserRole(userId, newRole, token);
      setUsers(users.map((u) => (u.id === userId ? updatedUser : u)));
    } catch (error) {
      console.error("Failed to update user role:", error);
      alert("Failed to update user role");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <ShieldCheck className="w-4 h-4 text-red-500" />;
      case "writer":
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <UserIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
      case "writer":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20";
    }
  };

  const adminCount = users.filter((u) => u.role === "admin").length;
  const writerCount = users.filter((u) => u.role === "writer").length;
  const userCount = users.filter((u) => u.role === "user").length;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Manage Users</h1>
            <p className="text-gray-600 dark:text-slate-400">View and manage user roles.</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username or email..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-stats-blue-900 border border-gray-300 dark:border-stats-blue-700 rounded-md text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-stats-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRoleFilter("all")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                roleFilter === "all"
                  ? "bg-stats-blue-600 text-white"
                  : "bg-gray-200 dark:bg-stats-blue-900 text-gray-700 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-stats-blue-700/50"
              }`}
            >
              All ({users.length})
            </button>
            <button
              onClick={() => setRoleFilter("admin")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                roleFilter === "admin"
                  ? "bg-stats-blue-600 text-white"
                  : "bg-gray-200 dark:bg-stats-blue-900 text-gray-700 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-stats-blue-700/50"
              }`}
            >
              Admins
            </button>
            <button
              onClick={() => setRoleFilter("writer")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                roleFilter === "writer"
                  ? "bg-stats-blue-600 text-white"
                  : "bg-gray-200 dark:bg-stats-blue-900 text-gray-700 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-stats-blue-700/50"
              }`}
            >
              Writers
            </button>
            <button
              onClick={() => setRoleFilter("user")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                roleFilter === "user"
                  ? "bg-stats-blue-600 text-white"
                  : "bg-gray-200 dark:bg-stats-blue-900 text-gray-700 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-stats-blue-700/50"
              }`}
            >
              Users
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-stats-blue-1000 border border-gray-300 dark:border-stats-blue-800 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-stats-blue-950 border-b border-gray-300 dark:border-stats-blue-800 text-xs uppercase tracking-wider text-gray-600 dark:text-slate-400 font-semibold">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Current Role</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-stats-blue-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-slate-500">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-slate-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u.id}
                      className={`hover:bg-gray-50 dark:hover:bg-stats-blue-900 transition-colors ${
                        u.id === user.id ? "bg-stats-blue-50 dark:bg-stats-blue-900/50" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-stats-blue-600 flex items-center justify-center text-white text-sm font-medium">
                            {u.username[0].toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-gray-900 dark:text-white font-medium">
                              {u.username}
                              {u.id === user.id && (
                                <span className="ml-2 text-xs text-stats-blue-600 dark:text-stats-blue-400">(you)</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-400 text-sm">{u.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeClass(
                            u.role
                          )}`}
                        >
                          {getRoleIcon(u.role)}
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-400 text-sm">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          {u.id === user.id ? (
                            <span className="text-xs text-gray-400 dark:text-slate-600">Cannot change own role</span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as "admin" | "writer" | "user")}
                              disabled={updatingUserId === u.id}
                              className="px-3 py-1.5 bg-white dark:bg-stats-blue-900 border border-gray-300 dark:border-stats-blue-700 rounded-md text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stats-blue-500 disabled:opacity-50"
                            >
                              <option value="user">User</option>
                              <option value="writer">Writer</option>
                              <option value="admin">Admin</option>
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
