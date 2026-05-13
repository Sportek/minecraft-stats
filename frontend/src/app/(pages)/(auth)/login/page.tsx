"use client";
import LoginForm from "@/components/form/login-form";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import { FC } from "react";

const LoginPage: FC = () => {
  return (
    <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col gap-2 border-b border-border px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent">
            <Icon icon="material-symbols:login" className="h-4 w-4" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Welcome back</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Sign in to manage your servers and access your dashboard.
        </p>
      </div>

      <div className="space-y-5 p-6">
        <LoginForm />

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-semibold text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
