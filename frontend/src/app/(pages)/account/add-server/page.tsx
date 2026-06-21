"use client";
import AddServerForm from "@/components/form/add-server-form";
import { Icon } from "@iconify/react/dist/iconify.js";
import { FC } from "react";

interface AddServerPageProps {}

const AddServerPage: FC<AddServerPageProps> = () => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-10">
      <div className="w-full max-w-2xl rounded-lg border border-border bg-card text-card-foreground shadow-xs">
        <div className="flex flex-col gap-2 border-b border-border px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent">
              <Icon icon="material-symbols:add-circle-outline" className="h-4 w-4" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">Add a server</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            List your Minecraft server to start tracking its player statistics.
          </p>
        </div>

        <div className="p-6">
          <AddServerForm />
        </div>
      </div>
    </div>
  );
};

export default AddServerPage;
