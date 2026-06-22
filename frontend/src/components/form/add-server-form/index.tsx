"use client";
import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FancyMultiSelect } from "@/components/ui/multi-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useServers } from "@/contexts/servers";
import { DuplicateServerError } from "@/http/server";
import { cn } from "@/lib/utils";
import { Category, Language } from "@/types/server";
import { cleanWebsiteHost } from "@/utils/server-website";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { FC } from "react";
import { useForm } from "react-hook-form";
import useSWRImmutable from "swr/immutable";
import { z } from "zod";

interface AddServerFormProps extends React.HTMLAttributes<HTMLFormElement> {}

/** Port d'écoute par défaut selon l'édition (Java TCP 25565, Bedrock UDP 19132). */
const DEFAULT_PORT: Record<"java" | "bedrock", string> = {
  java: "25565",
  bedrock: "19132",
};

const AddServerForm: FC<AddServerFormProps> = ({ className, ...props }) => {
  const { data, isLoading, error } = useSWRImmutable<Category[]>(`${getBaseUrl()}/categories`, fetcher);
  const { data: languagesData } = useSWRImmutable<Language[]>(`${getBaseUrl()}/languages`, fetcher);

  const categories = data || [];
  const languages = languagesData || [];

  const formSchema = z
    .object({
      name: z.string().min(1).trim(),
      address: z.string().min(1).trim(),
      type: z.enum(["java", "bedrock"]),
      port: z.string().min(1).max(5),
      website: z.string().trim().optional(),
      categories: z.array(z.string()),
      languages: z.array(z.string()),
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
      type: "java",
      port: DEFAULT_PORT.java,
      website: "",
      categories: [],
      languages: [],
    },
  });

  const { toast } = useToast();
  const { addServer } = useServers();

  const handleCategorySelectionChange = (selected: string[]) => {
    form.setValue("categories", selected);
  };

  const handleLanguageSelectionChange = (selected: string[]) => {
    form.setValue("languages", selected);
  };

  const onSubmit = async (credentials: z.infer<typeof formSchema>) => {
    try {
      await addServer({
        ...credentials,
        port: parseInt(credentials.port),
        website: cleanWebsiteHost(credentials.website) || undefined,
      });
      form.reset();
      toast({
        title: "Server added",
        description: "Your server has been added successfully, it will be available in a few minutes",
        variant: "success",
      });
    } catch (error) {
      if (error instanceof DuplicateServerError) {
        const safeServerId = encodeURIComponent(String(error.existingServer.id));
        toast({
          title: "Server already listed",
          description: (
            <span>
              This server is already on Minecraft Stats as{" "}
              <Link
                className="font-semibold underline"
                href={`/servers/${safeServerId}`}
              >
                {error.existingServer.name}
              </Link>
              .
            </span>
          ),
          variant: "error",
        });
        return;
      }
      toast({
        title: "Error while adding server",
        description: error instanceof Error ? error.message : "An error occurred while adding the server.",
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
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website (optional)</FormLabel>
                  <FormDescription>Left empty, we infer it from the address</FormDescription>
                  <FormControl>
                    <Input type="text" placeholder="example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Edition</FormLabel>
                  <FormDescription>Java or Bedrock edition</FormDescription>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={(value: "java" | "bedrock") => {
                        field.onChange(value);
                        // Bascule le port sur la valeur par défaut de l'édition choisie.
                        form.setValue("port", DEFAULT_PORT[value]);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="java">Java</SelectItem>
                        <SelectItem value="bedrock">Bedrock</SelectItem>
                      </SelectContent>
                    </Select>
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
                      onSelectionChange={handleCategorySelectionChange}
                      className="border border-input bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="languages"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Languages</FormLabel>
                  <FormDescription>The languages of the server</FormDescription>
                  <FormControl>
                    <FancyMultiSelect
                      title="Select languages..."
                      elements={languages.map((language) => ({
                        value: language.code,
                        label: `${language.flag} ${language.name}`
                      }))}
                      onSelectionChange={handleLanguageSelectionChange}
                      className="border border-input bg-background"
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
            <Button variant="accent" className="w-full" type="submit">
              Submit
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
};

export default AddServerForm;
