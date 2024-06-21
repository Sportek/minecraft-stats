"use client";
import LoginForm from "@/components/form/login-form";
import Link from "next/link";
import { FC } from "react";

interface LoginPageProps {}

const LoginPage: FC<LoginPageProps> = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full flex-1 py-8">
      <div className="shadow-md rounded-md p-4 w-full sm:w-fit gap-4 flex flex-col bg-white dark:bg-zinc-800">
        <h1 className="text-2xl font-bold">Login</h1>
        <div className="text-sm flex flex-row items-center gap-1">
          <div className="text-zinc-500 dark:text-zinc-400">Doesn&apos;t have an account yet?</div>
          <Link href="/sign-up" className="text-stats-blue-900 dark:text-stats-blue-50 underline font-semibold">
            Sign Up
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-4">
            <div className="w-screen max-w-2xl">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
