"use client";

import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminLoadingState, AdminMessageState } from "@/components/admin/admin-states";
import AdForm from "@/components/ads/ad-form";
import { useAuth } from "@/contexts/auth";
import { createAdvertisement } from "@/http/advertisement";
import { AdvertisementInput } from "@/types/advertisement";
import { useRouter } from "next/navigation";
import { useState } from "react";

const NewAdvertisementPage = () => {
  const { user, getToken } = useAuth();
  const token = getToken();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return <AdminLoadingState label="Chargement..." />;
  }

  if (user.role !== "admin") {
    return (
      <AdminMessageState
        tone="destructive"
        title="Accès refusé"
        description="Vous devez être administrateur pour accéder à cette page."
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
      alert(error instanceof Error ? error.message : "Impossible de créer la publicité");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-2 px-4 py-8 duration-300">
        <AdminBackLink href="/admin/advertisements" label="Retour à la liste" />

        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Nouvelle publicité</h1>
        </div>

        <AdForm submitting={submitting} submitLabel="Créer la publicité" onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default NewAdvertisementPage;
