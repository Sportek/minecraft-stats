import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("Common.notFound");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <h2 className="text-xl font-semibold">{t("title")}</h2>
      <p className="text-muted-foreground max-w-md">{t("description")}</p>
      <Link href="/" className={buttonVariants({ variant: "default" })}>
        {t("backHome")}
      </Link>
    </div>
  );
}
