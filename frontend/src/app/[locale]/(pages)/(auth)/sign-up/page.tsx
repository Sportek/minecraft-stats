"use client";
import AuthCard from "@/components/form/auth-card";
import SignUpForm from "@/components/form/sign-up-form";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "@/i18n/navigation";
import { FC } from "react";

const SignUpPage: FC = () => {
  return (
    <AuthCard
      icon={<Icon icon="lucide:user-plus" className="h-[18px] w-[18px]" />}
      title="Create your account"
      subtitle="Get a free account to add and manage your Minecraft servers."
    >
      <SignUpForm />

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
};

export default SignUpPage;
