import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function BlogPostNotFound() {
  const t = await getTranslations("Blog");

  return (
    <div className="flex items-center justify-center">
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-8 text-card-foreground shadow-xs sm:p-12">
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground">{t("notFound.title")}</h1>
          <p className="mb-8 text-muted-foreground">
            {t("notFound.description")}
          </p>
          <Button asChild variant="accent">
            <Link href="/blog">
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t("backToBlog")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
