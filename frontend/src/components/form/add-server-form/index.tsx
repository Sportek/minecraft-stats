"use client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useServers } from "@/contexts/servers";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface AddServerFormProps extends React.HTMLAttributes<HTMLFormElement> {}

const formSchema = z.object({
  name: z.string().min(1).trim(),
  address: z.string().min(1).trim(),
  port: z.number().int().min(1).max(65535),
});

const AddServerForm: FC<AddServerFormProps> = ({ className, ...props }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      port: 25565,
    },
  });

  const { toast } = useToast();
  const { addServer } = useServers();

  const onSubmit = async (credentials: z.infer<typeof formSchema>) => {
    try {
      await addServer(credentials);
      form.reset();
      toast({
        title: "Server added",
        description: "Your server has been added successfully",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Error while adding server",
        description: error.message,
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormDescription>The name of the server</FormDescription>
                <FormControl>
                  <Input type="text" placeholder="" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormDescription>The address of the server</FormDescription>
                <FormControl>
                  <Input type="text" placeholder="" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="port"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Port</FormLabel>
                <FormDescription>The port of the server</FormDescription>
                <FormControl>
                  <Input type="number" placeholder="" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button className="w-full" type="submit">
            Submit
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default AddServerForm;
