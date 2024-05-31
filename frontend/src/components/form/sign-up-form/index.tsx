"use client";

import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Icon } from "@iconify/react/dist/iconify.js";
import { FC, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface SignUpFormProps extends React.HTMLAttributes<HTMLFormElement> {}

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

  const { register } = useAuth();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (credentials: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      await register(credentials.username, credentials.email, credentials.password);
    } catch (error) {
      // clear le form
      if (error instanceof Error) {
        console.log(error.message);
        setErrorMessage(error.message);
        form.reset();
      }
    } finally {
      setLoading(false);
    }
  };

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
                <FormControl>
                  <Input placeholder="" {...field} />
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
          <Button variant={"outline"} className="w-full" type="button">
            <div className="flex items-center space-x-2 text-center">
              <Icon icon="logos:discord-icon" className="w-5 h-5" />
              <div>Register with Discord</div>
            </div>
          </Button>
          <Button variant={"outline"} className="w-full" type="button">
            <div className="flex items-center space-x-2 text-center">
              <Icon icon="logos:google-icon" className="w-5 h-5" />
              <div>Register with Google</div>
            </div>
          </Button>
          {errorMessage && <div className="text-red-700 text-center">{errorMessage}</div>}
          {loading && (
            <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
              <Loader message="Registering..." />
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};

export default SignUpForm;
