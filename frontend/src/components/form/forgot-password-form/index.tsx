"use client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { Turnstile, isTurnstileEnabled } from "@/components/form/turnstile";
import { requestPasswordReset } from "@/http/auth";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type ForgotPasswordFormProps = React.HTMLAttributes<HTMLFormElement>;

const formSchema = z.object({
  email: z.string().email().max(254).trim(),
});

const ForgotPasswordForm: FC<ForgotPasswordFormProps> = ({ className, ...props }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  const t = useTranslations("Auth");
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // Bumping this key remounts the widget for a fresh token after a failure.
  const [captchaKey, setCaptchaKey] = useState(0);

  const isSubmitting = form.formState.isSubmitting;
  const captchaMissing = isTurnstileEnabled && !captchaToken;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await requestPasswordReset({ email: values.email, turnstileToken: captchaToken });
      // Backend replies with the same generic response whether or not the account
      // exists (anti-enumeration), so we always land on the confirmation screen.
      setSubmitted(true);
    } catch (error) {
      setCaptchaToken(null);
      setCaptchaKey((key) => key + 1);
      toast({
        title: t("forgotPassword.errorTitle"),
        description: error instanceof Error ? error.message : t("forgotPassword.errorTitle"),
        variant: "error",
      });
    }
  };

  if (submitted) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
          <Icon icon="material-symbols:mark-email-read-outline" className="h-7 w-7" />
        </div>
        <div className="space-y-1.5">
          <p className="text-base font-semibold text-foreground">{t("forgotPassword.emailSentTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("forgotPassword.emailSentDescription")}</p>
        </div>
        <Link
          href="/login"
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-accent px-4 text-[15px] font-semibold text-accent-foreground shadow-xs transition-colors hover:bg-accent/90"
        >
          {t("forgotPassword.backToSignIn")}
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("fields.email")}</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" placeholder={t("fields.emailPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Turnstile key={captchaKey} onToken={setCaptchaToken} className="flex justify-center" />

          <Button
            variant="accent"
            className="h-11 w-full text-[15px]"
            type="submit"
            disabled={isSubmitting || captchaMissing}
          >
            {isSubmitting ? (
              <>
                <Spinner size="xs" tone="current" className="mr-2" />
                {t("forgotPassword.submitting")}
              </>
            ) : (
              t("forgotPassword.submit")
            )}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-semibold text-accent hover:underline">
          {t("forgotPassword.backToSignIn")}
        </Link>
      </p>
    </div>
  );
};

export default ForgotPasswordForm;
