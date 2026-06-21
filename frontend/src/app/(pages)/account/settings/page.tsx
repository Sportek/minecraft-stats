"use client";

import ChangePasswordForm from "@/components/form/change-password-form";
import DashboardLayout from "@/components/account/dashboard-layout";
import DashboardHero from "@/components/account/dashboard-hero";
import DangerZoneCard from "@/components/account/danger-zone-card";
import AvatarUpload from "@/components/account/avatar-upload";
import InfoField from "@/components/account/info-field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import { KeyRound, User as UserIcon } from "lucide-react";
import { useState } from "react";

const ROLE_LABELS: Record<string, string> = {
  user: "Member",
  writer: "Writer",
  admin: "Admin",
};

const SettingsPage = () => {
  const { user, logoutAll } = useAuth();
  const { toast } = useToast();
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  const handleLogoutAll = async () => {
    const confirmed = window.confirm(
      "Log out of all devices? This revokes every active session, including this one."
    );
    if (!confirmed) return;
    setIsLoggingOutAll(true);
    try {
      await logoutAll();
      toast({
        title: "All sessions revoked",
        description: "You have been logged out of every device.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "error",
      });
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  if (!user) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  const createdAt = new Date(user.createdAt);
  const memberSince = createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;

  return (
    <DashboardLayout>
      <DashboardHero
        avatar={{ name: user.username, src: user.avatarUrl }}
        title={user.username}
        badge={roleLabel}
        subtitle={`${user.email} · Member since ${memberSince}`}
      />

      {/* Your information (read-only) */}
      <section className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <UserIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
            <h2 className="text-base font-semibold tracking-tight text-foreground">Your information</h2>
          </div>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            Read-only
          </span>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 px-6 py-5 sm:grid-cols-2">
          <InfoField label="Username" value={user.username} />
          <InfoField label="Email" value={user.email} />
          <InfoField label="Role" value={roleLabel} />
          <InfoField
            label="Registered at"
            value={`${createdAt.toLocaleDateString()} ${createdAt.toLocaleTimeString()}`}
          />
        </div>
      </section>

      {/* Profile picture */}
      <AvatarUpload />

      {/* Manage password */}
      <section className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
          <KeyRound className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-foreground">Manage password</h2>
            <p className="text-sm text-muted-foreground">
              Choose a strong password you don&apos;t use anywhere else.
            </p>
          </div>
        </div>
        <div className="px-6 py-5">
          <ChangePasswordForm />
        </div>
      </section>

      {/* Danger zone */}
      <DangerZoneCard
        title="Log out of all devices"
        description="Sign out of every active session, including this one. Use this if you suspect your account has been compromised."
        action={
          <Button
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogoutAll}
            disabled={isLoggingOutAll}
          >
            {isLoggingOutAll ? "Logging out…" : "Log out everywhere"}
          </Button>
        }
      />
    </DashboardLayout>
  );
};

export default SettingsPage;
