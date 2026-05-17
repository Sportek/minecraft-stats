"use client";

import AdForm from "@/components/ads/ad-form";
import { useAuth } from "@/contexts/auth";
import { getAdminAdvertisement, updateAdvertisement } from "@/http/advertisement";
import { Advertisement, AdvertisementInput } from "@/types/advertisement";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const EditAdvertisementPage = () => {
  const { user, getToken } = useAuth();
  const token = getToken();
  const router = useRouter();
  const params = useParams();
  const adId = Number(params.id);

  const [ad, setAd] = useState<Advertisement | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token || !Number.isFinite(adId)) return;

    const fetchAd = async () => {
      try {
        setLoading(true);
        setAd(await getAdminAdvertisement(adId, token));
      } catch (error) {
        console.error("Failed to fetch advertisement:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [token, adId]);

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
      await updateAdvertisement(adId, data, token);
      router.push("/admin/advertisements");
    } catch (error) {
      console.error("Failed to update advertisement:", error);
      alert(error instanceof Error ? error.message : "Impossible de mettre à jour la publicité");
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
            Modifier la publicité
          </h1>
        </div>

        {loading ? (
          <div className="text-gray-500 dark:text-slate-500">Chargement de la publicité...</div>
        ) : ad ? (
          <AdForm
            initial={ad}
            submitting={submitting}
            submitLabel="Enregistrer les modifications"
            onSubmit={handleSubmit}
          />
        ) : (
          <div className="text-red-500">Publicité introuvable.</div>
        )}
      </div>
    </div>
  );
};

export default EditAdvertisementPage;
