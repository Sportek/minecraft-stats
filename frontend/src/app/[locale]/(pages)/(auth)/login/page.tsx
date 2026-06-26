"use client";
import AuthCard from "@/components/form/auth-card";
import LoginForm from "@/components/form/login-form";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "@/i18n/navigation";
import { FC } from "react";

const LoginPage: FC = () => {
  return (
    <AuthCard
      icon={<Icon icon="lucide:log-in" className="h-[18px] w-[18px]" />}
      title="Welcome back"
      subtitle="Sign in to manage your servers and access your dashboard."
    >
      <LoginForm />

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="font-semibold text-accent hover:underline">
          Sign up
        </Link>
      </p>
    </AuthCard>
  );
};

export default LoginPage;
