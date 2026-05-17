"use client";

import AdForm from "@/components/ads/ad-form";
import { useAuth } from "@/contexts/auth";
import { createAdvertisement } from "@/http/advertisement";
import { AdvertisementInput } from "@/types/advertisement";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const NewAdvertisementPage = () => {
  const { user, getToken } = useAuth();
  const token = getToken();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-900 dark:text-white">Chargement...</div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-red-500">Accès refusé</h1>
          <p className="text-gray-600 dark:text-slate-400">
            Vous devez être administrateur pour accéder à cette page.
          </p>
        </div>
      </div>
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
        <Link
          href="/admin/advertisements"
          className="mb-6 flex items-center gap-2 font-medium text-stats-blue-600 transition-colors hover:text-stats-blue-500 dark:text-stats-blue-400 dark:hover:text-stats-blue-300"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour à la liste
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Nouvelle publicité
          </h1>
        </div>

        <AdForm submitting={submitting} submitLabel="Créer la publicité" onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default NewAdvertisementPage;
