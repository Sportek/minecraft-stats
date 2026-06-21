"use client";
import SignUpForm from "@/components/form/sign-up-form";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import { FC } from "react";

const SignUpPage: FC = () => {
  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground shadow-xs">
      <div className="flex flex-col gap-2 border-b border-border px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent">
            <Icon icon="material-symbols:person-add-outline" className="h-4 w-4" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Create your account</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Get a free account to add and manage your Minecraft servers.
        </p>
      </div>

      <div className="space-y-5 p-6">
        <SignUpForm />

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
