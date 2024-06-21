"use client";
import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FancyMultiSelect } from "@/components/ui/multi-select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import { deleteServer, editServer } from "@/http/server";
import { cn } from "@/lib/utils";
import { Category, Server } from "@/types/server";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import { z } from "zod";

interface EditServerFormProps extends React.HTMLAttributes<HTMLFormElement> {
  server: Server;
  serverCategories: Category[];
  updateServer: () => void;
}

const EditServerForm: FC<EditServerFormProps> = ({ server, serverCategories, updateServer, className, ...props }) => {
  const { data, isLoading } = useSWR<Category[]>(`${getBaseUrl()}/categories`, fetcher);

  const categories = data || [];

  const { user, getToken } = useAuth();
  
  const router = useRouter();


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
   )
   .refine(
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
      name: server.name,
      address: server.address,
      port: server.port.toString(),
      categories: serverCategories.map((category) => category.name),
    },
  });

  const { toast } = useToast();

  if (!user) {
    return <div>You are not authorized to edit this server</div>;
  }


  const handleSelectionChange = (selected: string[]) => {
    form.setValue("categories", selected);
  };

  const onSubmit = async (credentials: z.infer<typeof formSchema>) => {
    try {
      await editServer(server.id, { ...credentials, port: parseInt(credentials.port) }, getToken() ?? "");
      form.reset();
      toast({
        title: "Server edited",
        description: "Your server has been edited successfully",
        variant: "success",
      });
      router.replace("/");
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error while editing server",
        description: error.message,
        variant: "error",
      });
    }
  };

  const onDelete = async () => {
    try {
      await deleteServer(server.id, getToken() ?? "");
      form.reset();
      toast({
        title: "Server deleted",
        description: "Your server has been deleted successfully",
        variant: "success",
      });
      router.replace("/");
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error while deleting server",
        description: error.message,
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
                      defaultSelected={field.value.map((category) => ({ value: category, label: category }))}
                      className="dark:bg-zinc-950 dark:text-white bg-white border border-zinc-800"
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
              Save
            </Button>
            {user.role === "admin" && (
              <Button className="w-full" variant="destructive" type="button" onClick={onDelete}>
                Delete
              </Button>
            )}
          </form>
        </Form>
      )}
    </div>
  );
};

export default EditServerForm;
