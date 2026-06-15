"use client";

import ChangePasswordForm from "@/components/form/change-password-form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";

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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "error",
      });
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full flex-1 py-8">
      <div className="bg-zinc-100 dark:bg-zinc-800 shadow-md rounded-md p-4 w-full sm:w-fit gap-4 flex flex-col">
        <h1 className="text-2xl font-bold">Profil</h1>
        <div className="flex flex-col gap-2">
          <div className="text-xl font-semibold">Your informations</div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col gap-2">
              <div className="text-sm font-semibold">Username</div>
              <div>{user.username}</div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-sm font-semibold">Email</div>
              <div>{user.email}</div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-sm font-semibold">Registered at</div>
              <div>
                {new Date(user.createdAt).toLocaleDateString()} {new Date(user.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-xl font-semibold">Manage Password</div>
          <div className="flex flex-row gap-4">
            <div className="w-screen max-w-2xl">
              <ChangePasswordForm />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-xl font-semibold">Security</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            Sign out of every device. Use this if you suspect your account has been compromised.
          </div>
          <Button variant="destructive" className="w-fit" onClick={handleLogoutAll}>
            Log out of all devices
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
