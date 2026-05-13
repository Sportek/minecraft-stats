"use client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Icon } from "@iconify/react/dist/iconify.js";
import { FC } from "react";
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

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (credentials: z.infer<typeof formSchema>) => {
    const response = await login(credentials.email, credentials.password);
    if (response?.message) {
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
    <div className={cn("space-y-4", className)}>
      {/* OAuth d'abord (pattern moderne) */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button type="button" variant="outline" className="w-full" onClick={loginWithDiscord}>
          <Icon icon="logos:discord-icon" className="mr-2 h-4 w-4" />
          Discord
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={loginWithGoogle}>
          <Icon icon="logos:google-icon" className="mr-2 h-4 w-4" />
          Google
        </Button>
      </div>

      <div className="relative flex items-center">
        <div className="h-px flex-1 bg-border" />
        <span className="px-3 text-xs uppercase tracking-wider text-muted-foreground">or with email</span>
        <div className="h-px flex-1 bg-border" />
      </div>

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

          <Button variant="accent" className="w-full" type="submit" disabled={isSubmitting}>
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
