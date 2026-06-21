"use client";

import { AdminFilterTabs } from "@/components/admin/admin-filter-tabs";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminLoadingState, AdminMessageState } from "@/components/admin/admin-states";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    return <AdminLoadingState label="Loading..." />;
  }

  if (user.role !== "admin") {
    return (
      <AdminMessageState
        tone="destructive"
        title="Access Denied"
        description="You must be an administrator to access this page."
      />
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
        return <ShieldCheck className="h-4 w-4" />;
      case "writer":
        return <Shield className="h-4 w-4" />;
      default:
        return <UserIcon className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string): BadgeProps["variant"] => {
    switch (role) {
      case "admin":
        return "destructive";
      case "writer":
        return "accent";
      default:
        return "secondary";
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto animate-in fade-in px-4 py-8 duration-300">
        <AdminPageHeader title="Manage Users" description="View and manage user roles." />

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username or email..."
              className="pl-10"
            />
          </div>

          <AdminFilterTabs
            value={roleFilter}
            onChange={setRoleFilter}
            tabs={[
              { value: "all", label: `All (${users.length})` },
              { value: "admin", label: "Admins" },
              { value: "writer", label: "Writers" },
              { value: "user", label: "Users" },
            ]}
          />
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-secondary text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Current Role</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u.id}
                      className={`transition-colors hover:bg-secondary/50 ${
                        u.id === user.id ? "bg-accent/5" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground">
                            {u.username[0].toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {u.username}
                              {u.id === user.id && (
                                <span className="ml-2 text-xs text-accent">(you)</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{u.email}</td>
                      <td className="px-6 py-4">
                        <Badge variant={getRoleBadgeVariant(u.role)} className="gap-1.5">
                          {getRoleIcon(u.role)}
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          {u.id === user.id ? (
                            <span className="text-xs text-muted-foreground">Cannot change own role</span>
                          ) : (
                            <Select
                              value={u.role}
                              onValueChange={(value) =>
                                handleRoleChange(u.id, value as "admin" | "writer" | "user")
                              }
                              disabled={updatingUserId === u.id}
                            >
                              <SelectTrigger className="h-9 w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="writer">Writer</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
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
