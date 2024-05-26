"use client";
import LoginForm from "@/components/form/login-form";
import Link from "next/link";
import { FC } from "react";

interface LoginPageProps {}

const LoginPage: FC<LoginPageProps> = () => {
  return (
    <div className="flex flex-col items-center flex-1 bg-white p-20 rounded-lg">
      <div className="flex flex-col gap-4 shadow-lg p-4 rounded-lg">
        <div>
          <div className="text-2xl font-bold">Login</div>
          <div className="text-sm flex flex-row items-center gap-1">
            <div className="text-zinc-500">Doesn&apos;t have an account yet?</div>
            <Link href="/sign-up" className="text-stats-blue-900 underline font-semibold">
              Sign Up
            </Link>
          </div>
        </div>
        <LoginForm className="w-[400px]" />
      </div>
    </div>
  );
};

export default LoginPage;
