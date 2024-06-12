"use client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Icon } from "@iconify/react/dist/iconify.js";
import { FC } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface LoginFormProps extends React.HTMLAttributes<HTMLFormElement> {}

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

  const { login } = useAuth();
  const { toast } = useToast();

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

  const { loginWithDiscord, loginWithGoogle } = useAuth();

  return (
    <div className={cn("flex flex-col", className)}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4 rounded-md" {...props} method="POST">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormDescription>Your email address</FormDescription>
                <FormControl>
                  <Input placeholder="" {...field} />
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
                <FormDescription>Your password</FormDescription>
                <FormControl>
                  <Input type="password" placeholder="" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button className="w-full" type="submit">
            Submit
          </Button>
          <div className="flex items-center justify-center space-x-2">
            <div className="h-px bg-gray-300 w-full" />
            <div className="text-gray-500 text-xs">Or</div>
            <div className="h-px bg-gray-300 w-full" />
          </div>
          <Button variant={"outline"} className="w-full" type="button" onClick={loginWithDiscord}>
            <div className="flex items-center space-x-2 text-center">
              <Icon icon="logos:discord-icon" className="w-5 h-5" />
              <div>Continue with Discord</div>
            </div>
          </Button>
          <Button variant={"outline"} className="w-full" type="button" onClick={loginWithGoogle}>
            <div className="flex items-center space-x-2 text-center">
              <Icon icon="logos:google-icon" className="w-5 h-5" />
              <div>Continue with Google</div>
            </div>
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default LoginForm;
