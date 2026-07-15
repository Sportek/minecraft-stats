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
import ClaimServerDialog from "@/components/serveur/claim-server-dialog";
import { cn } from "@/lib/utils";
import { Category, Language, Server } from "@/types/server";
import { cleanWebsiteHost } from "@/utils/server-website";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "@/i18n/navigation";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";
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
    ).refine(
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
  const router = useRouter();
  // Serveur tout juste créé : on propose de vérifier la propriété (point d'entrée post-ajout).
  const [createdServer, setCreatedServer] = useState<Server | null>(null);
  const [claimOpen, setClaimOpen] = useState(false);

  const handleCategorySelectionChange = (selected: string[]) => {
    form.setValue("categories", selected);
  };

  const handleLanguageSelectionChange = (selected: string[]) => {
    form.setValue("languages", selected);
  };

  const onSubmit = async (credentials: z.infer<typeof formSchema>) => {
    try {
      const server = await addServer({
        ...credentials,
        port: parseInt(credentials.port),
        website: cleanWebsiteHost(credentials.website) || undefined,
      });
      form.reset();
      toast({
        title: t("addServer.successTitle"),
        description: t("addServer.successDescription"),
        variant: "success",
      });
      // Bascule sur l'invite de vérification de propriété plutôt que de rester sur le formulaire.
      setCreatedServer(server);
    } catch (error) {
      if (error instanceof DuplicateServerError) {
        const safeServerId = encodeURIComponent(String(error.existingServer.id));
        toast({
          title: t("addServer.duplicateTitle"),
          description: t.rich("addServer.duplicateDescription", {
            name: error.existingServer.name,
            link: (chunks) => (
              <Link className="font-semibold underline" href={`/servers/${safeServerId}`}>
                {chunks}
              </Link>
            ),
          }),
          variant: "error",
        });
        return;
      }
      toast({
        title: t("addServer.errorTitle"),
        description: error instanceof Error ? error.message : t("addServer.errorDescription"),
        variant: "error",
      });
    }
  };

  if (createdServer) {
    return (
      <div className={cn("flex flex-col", className)}>
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 text-card-foreground">
          <div className="flex items-center gap-2 text-success">
            <BadgeCheck className="h-5 w-5" />
            <span className="font-semibold">{t("addServer.successTitle")}</span>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="font-semibold text-foreground">{t("addServer.claimPromptTitle")}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{t("addServer.claimPromptBody")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="accent" onClick={() => setClaimOpen(true)} className="gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                {t("addServer.claimCta")}
              </Button>
              <Link href={`/servers/${createdServer.id}`}>
                <Button variant="secondary">{t("addServer.viewServer")}</Button>
              </Link>
              <Button variant="ghost" onClick={() => setCreatedServer(null)}>
                {t("addServer.addAnother")}
              </Button>
            </div>
          </div>
        </div>

        <ClaimServerDialog
          serverId={createdServer.id}
          serverName={createdServer.name}
          open={claimOpen}
          onOpenChange={setClaimOpen}
          onVerified={() => router.push(`/servers/${createdServer.id}`)}
        />
      </div>
    );
  }

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
                  <FormLabel>{t("serverForm.categories")}</FormLabel>
                  <FormDescription>{t("serverForm.categoriesDescription")}</FormDescription>
                  <FormControl>
                    <FancyMultiSelect
                      title={t("serverForm.selectCategories")}
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
              {t("addServer.submit")}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
};

export default AddServerForm;
