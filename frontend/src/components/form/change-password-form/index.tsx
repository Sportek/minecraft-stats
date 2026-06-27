"use client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface ChangePasswordFormProps extends React.HTMLAttributes<HTMLFormElement> {}

type FormValues = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const ChangePasswordForm: FC<ChangePasswordFormProps> = ({ className, ...props }) => {
  const t = useTranslations("Auth");
  const formSchema = useMemo(
    () =>
      z
        .object({
          oldPassword: z.string().min(8).trim(),
          newPassword: z.string().min(8).trim(),
          confirmPassword: z.string().min(8).trim(),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: t("validation.passwordsDoNotMatch"),
          path: ["confirmPassword"],
        })
        .refine((data) => data.newPassword !== data.oldPassword, {
          message: t("validation.newPasswordSameAsOld"),
          path: ["newPassword"],
        }),
    [t],
  );
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  const { changePassword } = useAuth();
  const { toast } = useToast();

  const onSubmit = async (credentials: FormValues) => {
    try {
      await changePassword(credentials.oldPassword, credentials.newPassword);
      form.reset();
      toast({
        title: t("changePassword.successTitle"),
        description: t("changePassword.successDescription"),
        variant: "success",
      });
    } catch (error) {
      toast({
        title: t("changePassword.errorTitle"),
        description: error instanceof Error ? error.message : t("changePassword.errorTitle"),
        variant: "error",
      });
    }
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4 rounded-md" {...props} method="POST">
          <p className="text-sm text-muted-foreground">{t("changePassword.hint")}</p>
          <FormField
            control={form.control}
            name="oldPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("changePassword.oldPassword")}</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("changePassword.newPassword")}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="" {...field} />
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
                  <FormLabel>{t("changePassword.confirmPassword")}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button variant="accent" className="w-full" type="submit">
            {t("changePassword.submit")}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ChangePasswordForm;
