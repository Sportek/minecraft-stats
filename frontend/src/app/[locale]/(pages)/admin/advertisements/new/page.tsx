"use client";

import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminLoadingState, AdminMessageState } from "@/components/admin/admin-states";
import AdForm from "@/components/ads/ad-form";
import { useAuth } from "@/contexts/auth";
import { createAdvertisement } from "@/http/advertisement";
import { AdvertisementInput } from "@/types/advertisement";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

const NewAdvertisementPage = () => {
  const { user, getToken } = useAuth();
  const t = useTranslations("Admin");
  const token = getToken();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return <AdminLoadingState label={t("states.loading")} />;
  }

  if (user.role !== "admin") {
    return (
      <AdminMessageState
        tone="destructive"
        title={t("states.accessDenied")}
        description={t("states.adminOnly")}
      />
    );
  }

  const handleSubmit = async (data: AdvertisementInput) => {
    if (!token) return;
    try {
      setSubmitting(true);
      await createAdvertisement(data, token);
      router.push("/admin/advertisements");
    } catch (error) {
      console.error("Failed to create advertisement:", error);
      alert(error instanceof Error ? error.message : t("ads.createError"));
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-2 px-4 py-8 duration-300">
        <AdminBackLink href="/admin/advertisements" label={t("ads.backToList")} />

        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("ads.newPageTitle")}</h1>
        </div>

        <AdForm submitting={submitting} submitLabel={t("ads.createSubmit")} onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default NewAdvertisementPage;
