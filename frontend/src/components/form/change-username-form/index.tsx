"use client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { FC } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type ChangeUsernameFormProps = React.HTMLAttributes<HTMLFormElement>;

const formSchema = z.object({
  username: z.string().min(3).max(254).trim(),
});

const ChangeUsernameForm: FC<ChangeUsernameFormProps> = ({ className, ...props }) => {
  const t = useTranslations("Account");
  const { user, changeUsername } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: user?.username ?? "" },
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (values.username === user?.username) {
      toast({ title: t("settings.usernameUnchanged"), variant: "error" });
      return;
    }
    try {
      await changeUsername(values.username);
      form.reset({ username: values.username });
      toast({
        title: t("settings.usernameSuccessTitle"),
        description: t("settings.usernameSuccessDescription"),
        variant: "success",
      });
    } catch (error) {
      toast({
        title: t("settings.usernameErrorTitle"),
        description: error instanceof Error ? error.message : t("settings.usernameErrorTitle"),
        variant: "error",
      });
    }
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4 rounded-md" {...props} method="POST">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("settings.username")}</FormLabel>
                <FormControl>
                  <Input autoComplete="username" placeholder={user?.username ?? ""} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button variant="accent" className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("settings.usernameSubmitting") : t("settings.usernameSubmit")}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ChangeUsernameForm;
