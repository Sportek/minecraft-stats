"use client";

import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminLoadingState, AdminMessageState } from "@/components/admin/admin-states";
import AdForm from "@/components/ads/ad-form";
import { useAuth } from "@/contexts/auth";
import { getAdminAdvertisement, updateAdvertisement } from "@/http/advertisement";
import { Advertisement, AdvertisementInput } from "@/types/advertisement";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
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
    return <AdminLoadingState label="Loading…" />;
  }

  if (user.role !== "admin") {
    return (
      <AdminMessageState
        tone="destructive"
        title="Access denied"
        description="You must be an administrator to access this page."
      />
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
      alert(error instanceof Error ? error.message : "Unable to update the advertisement");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-2 px-4 py-8 duration-300">
        <AdminBackLink href="/admin/advertisements" label="Back to the list" />

        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit advertisement</h1>
        </div>

        {loading ? (
          <div className="text-muted-foreground">Loading advertisement…</div>
        ) : ad ? (
          <AdForm
            initial={ad}
            submitting={submitting}
            submitLabel="Save changes"
            onSubmit={handleSubmit}
          />
        ) : (
          <div className="text-destructive">Advertisement not found.</div>
        )}
      </div>
    </div>
  );
};

export default EditAdvertisementPage;
