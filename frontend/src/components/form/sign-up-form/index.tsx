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
import { FC, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type SignUpFormProps = React.HTMLAttributes<HTMLFormElement>;

const formSchema = z.object({
  username: z.string().min(3).max(254).trim(),
  email: z.string().email().max(254).trim(),
  password: z.string().min(8).max(72).trim(),
});

const SignUpForm: FC<SignUpFormProps> = ({ className, ...props }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
    },
  });

  const { register, loginWithDiscord, loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (credentials: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      await register(credentials.username, credentials.email, credentials.password);
      toast({
        title: "Registration successful",
        description:
          "Your account has been created — check your inbox to confirm your email.",
        variant: "success",
      });
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Error while registering",
          description: error.message,
          variant: "error",
        });
        form.reset();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
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
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input autoComplete="username" placeholder="Sportek" {...field} />
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
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button variant="accent" className="w-full" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner size="xs" tone="current" className="mr-2" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            By creating an account you agree to our{" "}
            <a href="/cgu" className="underline hover:text-foreground">
              terms of service
            </a>
            .
          </p>
        </form>
      </Form>
    </div>
  );
};

export default SignUpForm;
