"use client";

import ChangePasswordForm from "@/components/form/change-password-form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import { KeyRound, ShieldAlert, User as UserIcon } from "lucide-react";

const SettingsPage = () => {
  const { user, logoutAll } = useAuth();
  const { toast } = useToast();

  const handleLogoutAll = async () => {
    const confirmed = window.confirm(
      "Log out of all devices? This revokes every active session, including this one."
    );
    if (!confirmed) return;
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
    }
  };

  if (!user) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 py-8">
      <div>
        <div className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-accent">Account</div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile, password, and active sessions.</p>
      </div>

      {/* Profile */}
      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
            <UserIcon className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Your information</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Username</div>
            <div className="text-sm font-medium text-foreground">{user.username}</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</div>
            <div className="text-sm font-medium text-foreground">{user.email}</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Registered at</div>
            <div className="text-sm font-medium text-foreground">
              {new Date(user.createdAt).toLocaleDateString()} {new Date(user.createdAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </section>

      {/* Password */}
      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
            <KeyRound className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Manage password</h2>
        </div>
        <div className="max-w-2xl">
          <ChangePasswordForm />
        </div>
      </section>

      {/* Security */}
      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xs">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Security</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Sign out of every device. Use this if you suspect your account has been compromised.
        </p>
        <Button variant="destructive" className="w-fit" onClick={handleLogoutAll}>
          Log out of all devices
        </Button>
      </section>
    </div>
  );
};

export default SettingsPage;
