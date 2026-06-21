"use client";

import DashboardHero from "@/components/account/dashboard-hero";
import DashboardLayout from "@/components/account/dashboard-layout";
import DashboardStatTile from "@/components/account/dashboard-stat-tile";
import { AdminFilterTabs } from "@/components/admin/admin-filter-tabs";
import { AdminLoadingState, AdminMessageState } from "@/components/admin/admin-states";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LetterTile } from "@/components/ui/letter-tile";
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
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

const AdminUsersPage = () => {
  const { user, getToken } = useAuth();
  const token = getToken();
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "writer" | "user">("all");
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  // Filtered fetch (search + role) that drives the table rows.
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

  // Separate unfiltered fetch so the stat tiles always reflect the full set of
  // users, independent of the active role filter tab.
  useEffect(() => {
    if (!token) return;

    const fetchAllUsers = async () => {
      try {
        const response = await getAdminUsers(token, 1, 100, "", "all");
        setAllUsers(response.data);
        setTotal(response.meta.total);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    fetchAllUsers();
  }, [token]);

  const adminCount = useMemo(() => allUsers.filter((u) => u.role === "admin").length, [allUsers]);
  const writerCount = useMemo(() => allUsers.filter((u) => u.role === "writer").length, [allUsers]);
  const memberCount = useMemo(() => allUsers.filter((u) => u.role === "user").length, [allUsers]);

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
      setAllUsers(allUsers.map((u) => (u.id === userId ? updatedUser : u)));
    } catch (error) {
      console.error("Failed to update user role:", error);
      alert("Failed to update user role");
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <DashboardLayout>
      <DashboardHero
        title="Users"
        subtitle="Manage roles and access across the platform."
        badge={`${total} total`}
      />

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DashboardStatTile label="Total Users" value={String(total)} />
        <DashboardStatTile label="Admins" value={String(adminCount)} dot="success" />
        <DashboardStatTile label="Writers" value={String(writerCount)} dot="success" />
        <DashboardStatTile label="Members" value={String(memberCount)} />
      </div>

      {/* Users card */}
      <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <AdminFilterTabs
            value={roleFilter}
            onChange={setRoleFilter}
            tabs={[
              { value: "all", label: "All" },
              { value: "admin", label: "Admins" },
              { value: "writer", label: "Writers" },
              { value: "user", label: "Users" },
            ]}
          />
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="px-6 py-12 text-center text-muted-foreground">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
              <Search className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">No users found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nothing matches this filter or search. Try another tab.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {users.map((u) => (
              <li
                key={u.id}
                className="flex flex-col gap-3 p-4 transition-colors hover:bg-secondary/40 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <LetterTile name={u.username} className="h-10 w-10 rounded-md text-sm" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {u.username}
                      {u.id === user.id && <span className="ml-2 text-xs text-accent">(you)</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Joined {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <Badge variant={getRoleBadgeVariant(u.role)}>
                    {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                  </Badge>
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
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminUsersPage;
