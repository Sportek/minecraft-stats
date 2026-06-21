"use client";

import AddServerForm from "@/components/form/add-server-form";
import DashboardLayout from "@/components/account/dashboard-layout";
import DashboardHero from "@/components/account/dashboard-hero";
import { Icon } from "@iconify/react/dist/iconify.js";
import { FC } from "react";

interface AddServerPageProps {}

const AddServerPage: FC<AddServerPageProps> = () => {
  return (
    <DashboardLayout>
      <DashboardHero
        title="Add Server"
        badge="New"
        subtitle="Track a new Minecraft server's live player count and uptime."
      />

      {/* Server details */}
      <section className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
            <Icon icon="material-symbols:add-circle-outline" className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-foreground">Server details</h2>
            <p className="text-sm text-muted-foreground">
              We&apos;ll ping the address every 10 minutes to keep stats fresh.
            </p>
          </div>
        </div>
        <div className="px-6 py-5">
          <AddServerForm />
        </div>
      </section>
    </DashboardLayout>
  );
};

export default AddServerPage;
