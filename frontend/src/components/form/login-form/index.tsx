"use client";
import EmailDivider from "@/components/form/auth-card/email-divider";
import OAuthButtons from "@/components/form/auth-card/oauth-buttons";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { Turnstile, isTurnstileEnabled } from "@/components/form/turnstile";
import { useAuth } from "@/contexts/auth";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type LoginFormProps = React.HTMLAttributes<HTMLFormElement>;

const formSchema = z.object({
  email: z.string().email().trim(),
  password: z.string().min(8).trim(),
});

const LoginForm: FC<LoginFormProps> = ({ className, ...props }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { login, loginWithDiscord, loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // Bumping this key remounts the widget to get a fresh token after a failure
  // (Turnstile tokens are single-use).
  const [captchaKey, setCaptchaKey] = useState(0);

  const isSubmitting = form.formState.isSubmitting;
  const captchaMissing = isTurnstileEnabled && !captchaToken;

  const resetCaptcha = () => {
    setCaptchaToken(null);
    setCaptchaKey((key) => key + 1);
  };

  const onSubmit = async (credentials: z.infer<typeof formSchema>) => {
    const response = await login(credentials.email, credentials.password, captchaToken);
    if (response?.message) {
      resetCaptcha();
      toast({
        title: "Error while logging in",
        description: response.message,
        variant: "error",
      });
    } else {
      toast({
        title: "Login successful",
        description: "Your account has been logged in successfully",
        variant: "success",
      });
    }
  };

  return (
    <div className={cn("space-y-5", className)}>
      {/* OAuth first (modern pattern). */}
      <OAuthButtons onDiscord={loginWithDiscord} onGoogle={loginWithGoogle} />

      <EmailDivider />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" {...props} method="POST">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="current-password" placeholder="••••••••" {...field} />
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
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default LoginForm;
