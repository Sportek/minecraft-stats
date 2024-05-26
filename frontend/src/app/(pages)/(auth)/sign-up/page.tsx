"use client";
import SignUpForm from "@/components/form/sign-up-form";
import Link from "next/link";
import { FC } from "react";

interface SignUpPageProps {}

const SignUpPage: FC<SignUpPageProps> = () => {
  return (
    <div className="flex flex-col items-center flex-1 p-20 bg-white rounded-lg">
      <div className="flex flex-col gap-4 shadow-lg p-4 rounded-lg">
        <div>
          <div className="text-2xl font-bold">Sign Up</div>
          <div className="text-sm flex flex-row items-center gap-1">
            <div className="text-zinc-500">Already have an account?</div>
            <Link href="/login" className="text-stats-blue-900 underline font-semibold">
              Login
            </Link>
          </div>
        </div>
        <SignUpForm className="w-[400px]" />
      </div>
    </div>
  );
};

export default SignUpPage;
