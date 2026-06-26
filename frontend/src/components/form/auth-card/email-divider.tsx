"use client";
import { useTranslations } from "next-intl";

/** Horizontal divider with a centered uppercase "OR WITH EMAIL" label. */
const EmailDivider = () => {
  const t = useTranslations("Auth");

  return (
    <div className="flex items-center gap-3.5">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {t("divider.orWithEmail")}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
};

export default EmailDivider;
