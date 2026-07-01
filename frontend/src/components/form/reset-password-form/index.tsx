"use client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { resetPassword } from "@/http/auth";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { FC, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface ResetPasswordFormProps extends React.HTMLAttributes<HTMLFormElement> {
  token: string;
}

type FormValues = {
  password: string;
  confirmPassword: string;
};

const ResetPasswordForm: FC<ResetPasswordFormProps> = ({ token, className, ...props }) => {
  const t = useTranslations("Auth");
  const formSchema = useMemo(
    () =>
      z
        .object({
          password: z.string().min(8).max(72).trim(),
          confirmPassword: z.string().min(8).max(72).trim(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t("validation.passwordsDoNotMatch"),
          path: ["confirmPassword"],
        }),
    [t],
  );
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const { toast } = useToast();
  const [done, setDone] = useState(false);

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: FormValues) => {
    try {
      await resetPassword({ token, password: values.password });
      setDone(true);
    } catch (error) {
      toast({
        title: t("resetPassword.errorTitle"),
        description: error instanceof Error ? error.message : t("resetPassword.errorTitle"),
        variant: "error",
      });
    }
  };

  if (done) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
          <Icon icon="material-symbols:check-circle" className="h-7 w-7" />
        </div>
        <div className="space-y-1.5">
          <p className="text-base font-semibold text-foreground">{t("resetPassword.successTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("resetPassword.successDescription")}</p>
        </div>
        <Link
          href="/login"
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-accent px-4 text-[15px] font-semibold text-accent-foreground shadow-xs transition-colors hover:bg-accent/90"
        >
          {t("resetPassword.continueToSignIn")}
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("space-y-5", className)}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" {...props} method="POST">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("resetPassword.newPassword")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder={t("fields.passwordHint")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("resetPassword.confirmPassword")}</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            variant="accent"
            className="h-11 w-full text-[15px]"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner size="xs" tone="current" className="mr-2" />
                {t("resetPassword.submitting")}
              </>
            ) : (
              t("resetPassword.submit")
            )}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/forgot-password" className="font-semibold text-accent hover:underline">
          {t("resetPassword.requestNewLink")}
        </Link>
      </p>
    </div>
  );
};

export default ResetPasswordForm;
