"use client";
import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FancyMultiSelect } from "@/components/ui/multi-select";
import { useToast } from "@/components/ui/use-toast";
import { useServers } from "@/contexts/servers";
import { cn } from "@/lib/utils";
import { Category } from "@/types/server";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC } from "react";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import { z } from "zod";

interface AddServerFormProps extends React.HTMLAttributes<HTMLFormElement> {}

const AddServerForm: FC<AddServerFormProps> = ({ className, ...props }) => {
  const { data, isLoading, error } = useSWR<Category[]>(`${getBaseUrl()}/categories`, fetcher);

  const categories = data || [];

  const formSchema = z
    .object({
      name: z.string().min(1).trim(),
      address: z.string().min(1).trim(),
      port: z.string().min(1).max(5),
      categories: z.array(z.string()),
    })
    .refine(
      (data) => {
        return parseInt(data.port) >= 1 && parseInt(data.port) <= 65535;
      },
      {
        path: ["port"],
        message: "Port must be between 1 and 65535",
      }
    ).refine(
      (data) => {
        return data.categories.every((category) => categories.some((c) => c.name === category));
      },
      {
        path: ["categories"],
        message: "Category not found",
      }
    );


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      port: "25565",
      categories: [],
    },
  });

  const { toast } = useToast();
  const { addServer } = useServers();

  const handleSelectionChange = (selected: string[]) => {
    form.setValue("categories", selected);
  };

  const onSubmit = async (credentials: z.infer<typeof formSchema>) => {
    try {
      await addServer({ ...credentials, port: parseInt(credentials.port) });
      form.reset();
      toast({
        title: "Server added",
        description: "Your server has been added successfully, it will be available in a few minutes",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Error while adding server",
        description: "The server is already registered",
        variant: "error",
      });
    }
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {isLoading ? (
        <Loader message={"Loading..."} />
      ) : (
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
              name="categories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categories</FormLabel>
                  <FormDescription>The category of the server</FormDescription>
                  <FormControl>
                    <FancyMultiSelect
                      title="Select categories..."
                      elements={categories.map((category) => ({ value: category.name, label: category.name }))}
                      onSelectionChange={handleSelectionChange}
                    />
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
      )}
    </div>
  );
};

export default AddServerForm;
