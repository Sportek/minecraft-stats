"use client";

import ChangePasswordForm from "@/components/form/change-password-form";
import { useAuth } from "@/contexts/auth";

const SettingsPage = () => {
  const { user } = useAuth();
  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full flex-1 py-8">
      <div className="bg-zinc-100 shadow-md rounded-md p-4 w-fit gap-4 flex flex-col">
        <h1 className="text-2xl font-bold">Profil</h1>
        <div className="flex flex-col gap-2">
          <div className="text-xl font-semibold">Your informations</div>
          <div className="flex flex-row gap-4">
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
            <div className="flex flex-col gap-2 w-full">
              <ChangePasswordForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
