"use client";
import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FancyMultiSelect } from "@/components/ui/multi-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import { deleteServer, editServer } from "@/http/server";
import { cn } from "@/lib/utils";
import { Category, Language, Server } from "@/types/server";
import { cleanWebsiteHost } from "@/utils/server-website";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { FC } from "react";
import { useForm } from "react-hook-form";
import useSWRImmutable from "swr/immutable";
import { z } from "zod";

interface EditServerFormProps extends React.HTMLAttributes<HTMLFormElement> {
  server: Server;
  serverCategories: Category[];
  updateServer: () => void;
}

const EditServerForm: FC<EditServerFormProps> = ({ server, serverCategories, updateServer, className, ...props }) => {
  const { data, isLoading } = useSWRImmutable<Category[]>(`${getBaseUrl()}/categories`, fetcher);

  const categories = data || [];

  const { data: languagesData } = useSWRImmutable<Language[]>(`${getBaseUrl()}/languages`, fetcher);

  const languages = languagesData || [];

  const { user, getToken } = useAuth();

  const router = useRouter();

  const t = useTranslations("Auth");


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
       message: t("validation.portRange"),
     }
   )
   .refine(
     (data) => {
       return data.categories.every((category) => categories.some((c) => c.name === category));
     },
     {
       path: ["categories"],
       message: t("validation.categoryNotFound"),
     }
   );


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: server.name,
      address: server.address,
      type: server.type,
      port: server.port.toString(),
      website: server.website ?? "",
      categories: serverCategories.map((category) => category.name),
      languages: server.languages.map((language) => language.code),
    },
  });

  const { toast } = useToast();

  if (!user) {
    return <div>{t("editServer.unauthorized")}</div>;
  }


  const handleCategorySelectionChange = (selected: string[]) => {
    form.setValue("categories", selected);
  };

  const handleLanguageSelectionChange = (selected: string[]) => {
    form.setValue("languages", selected);
  };

  const onSubmit = async (credentials: z.infer<typeof formSchema>) => {
    try {
      await editServer(
        server.id,
        { ...credentials, port: parseInt(credentials.port), website: cleanWebsiteHost(credentials.website) || undefined },
        getToken() ?? ""
      );
      form.reset();
      toast({
        title: t("editServer.successTitle"),
        description: t("editServer.successDescription"),
        variant: "success",
      });
      router.replace("/");
      router.refresh();
    } catch (error) {
      toast({
        title: t("editServer.errorTitle"),
        description: error instanceof Error ? error.message : t("editServer.errorTitle"),
        variant: "error",
      });
    }
  };

  const onDelete = async () => {
    try {
      await deleteServer(server.id, getToken() ?? "");
      form.reset();
      toast({
        title: t("editServer.deletedTitle"),
        description: t("editServer.deletedDescription"),
        variant: "success",
      });
      router.replace("/");
      router.refresh();
    } catch (error) {
      toast({
        title: t("editServer.deleteErrorTitle"),
        description: error instanceof Error ? error.message : t("editServer.deleteErrorTitle"),
        variant: "error",
      });
    }
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {isLoading ? (
        <Loader message={t("serverForm.loading")} />
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4 rounded-md" {...props} method="POST">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("serverForm.name")}</FormLabel>
                  <FormDescription>{t("serverForm.nameDescription")}</FormDescription>
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
                  <FormLabel>{t("serverForm.address")}</FormLabel>
                  <FormDescription>{t("serverForm.addressDescription")}</FormDescription>
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
                  <FormLabel>{t("serverForm.website")}</FormLabel>
                  <FormDescription>{t("serverForm.websiteDescription")}</FormDescription>
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
                  <FormLabel>{t("serverForm.edition")}</FormLabel>
                  <FormDescription>{t("serverForm.editionDescription")}</FormDescription>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
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
                  <FormLabel>{t("serverForm.categories")}</FormLabel>
                  <FormDescription>{t("serverForm.categoriesDescription")}</FormDescription>
                  <FormControl>
                    <FancyMultiSelect
                      title={t("serverForm.selectCategories")}
                      elements={categories.map((category) => ({ value: category.name, label: category.name }))}
                      onSelectionChange={handleCategorySelectionChange}
                      defaultSelected={field.value.map((category) => ({ value: category, label: category }))}
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
                  <FormLabel>{t("serverForm.languages")}</FormLabel>
                  <FormDescription>{t("serverForm.languagesDescription")}</FormDescription>
                  <FormControl>
                    <FancyMultiSelect
                      title={t("serverForm.selectLanguages")}
                      elements={languages.map((language) => ({
                        value: language.code,
                        label: `${language.flag} ${language.name}`
                      }))}
                      onSelectionChange={handleLanguageSelectionChange}
                      defaultSelected={field.value.map((code) => {
                        const language = languages.find((l) => l.code === code);
                        return {
                          value: code,
                          label: language ? `${language.flag} ${language.name}` : code
                        };
                      })}
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
                  <FormLabel>{t("serverForm.port")}</FormLabel>
                  <FormDescription>{t("serverForm.portDescription")}</FormDescription>
                  <FormControl>
                    <Input type="number" placeholder="" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button variant="accent" className="w-full" type="submit">
              {t("editServer.save")}
            </Button>
            {user.role === "admin" && (
              <Button className="w-full" variant="destructive" type="button" onClick={onDelete}>
                {t("editServer.delete")}
              </Button>
            )}
          </form>
        </Form>
      )}
    </div>
  );
};

export default EditServerForm;
