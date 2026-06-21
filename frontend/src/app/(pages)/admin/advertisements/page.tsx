"use client";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminLoadingState, AdminMessageState } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import {
  deleteAdvertisement,
  getAdminAdvertisements,
  updateAdvertisement,
} from "@/http/advertisement";
import { Advertisement } from "@/types/advertisement";
import { BarChart3, Pencil, Plus, Power, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const AdminAdvertisementsPage = () => {
  const { user, getToken } = useAuth();
  const token = getToken();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchAds = async () => {
      try {
        setLoading(true);
        setAds(await getAdminAdvertisements(token));
      } catch (error) {
        console.error("Failed to fetch advertisements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [token]);

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

  const handleToggle = async (ad: Advertisement) => {
    if (!token) return;
    try {
      const updated = await updateAdvertisement(ad.id, { enabled: !ad.enabled }, token);
      setAds((prev) => prev.map((a) => (a.id === ad.id ? { ...a, enabled: updated.enabled } : a)));
    } catch (error) {
      console.error("Failed to toggle advertisement:", error);
      alert("Impossible de modifier la publicité");
    }
  };

  const handleDelete = async (adId: number) => {
    if (!token) return;
    if (!confirm("Supprimer définitivement cette publicité et ses statistiques ?")) return;
    try {
      await deleteAdvertisement(adId, token);
      setAds((prev) => prev.filter((a) => a.id !== adId));
    } catch (error) {
      console.error("Failed to delete advertisement:", error);
      alert("Impossible de supprimer la publicité");
    }
  };

  const placementLabel = (ad: Advertisement) => {
    const slots: string[] = [];
    if (ad.showOnHome) slots.push("Accueil");
    if (ad.showOnServer) slots.push("Serveurs");
    return slots.length > 0 ? slots.join(" + ") : "Aucun";
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto animate-in fade-in px-4 py-8 duration-300">
        <AdminPageHeader
          title="Gérer les publicités"
          description="Créez, activez et suivez les performances de vos bannières publicitaires."
          action={
            <Button asChild variant="accent">
              <Link href="/admin/advertisements/new">
                <Plus className="h-5 w-5" />
                <span>Nouvelle publicité</span>
              </Link>
            </Button>
          }
        />

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-secondary text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">Nom</th>
                  <th className="px-6 py-4">Emplacements</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Vues / Clics</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      Chargement des publicités...
                    </td>
                  </tr>
                ) : ads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      Aucune publicité. Cliquez sur «&nbsp;Nouvelle publicité&nbsp;» pour commencer.
                    </td>
                  </tr>
                ) : (
                  ads.map((ad) => (
                    <tr key={ad.id} className="group transition-colors hover:bg-secondary/50">
                      <td className="px-6 py-4">
                        <span className="font-medium text-foreground">{ad.name}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {placementLabel(ad)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={ad.enabled ? "success" : "secondary"}>
                          {ad.enabled ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {(ad.impressionsCount ?? 0).toLocaleString("fr-FR")} /{" "}
                        {(ad.clicksCount ?? 0).toLocaleString("fr-FR")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${
                              ad.enabled
                                ? "text-success hover:text-success"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                            onClick={() => handleToggle(ad)}
                            title={ad.enabled ? "Désactiver" : "Activer"}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-accent"
                            title="Statistiques"
                          >
                            <Link href={`/admin/advertisements/${ad.id}/stats`}>
                              <BarChart3 className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-accent"
                            title="Modifier"
                          >
                            <Link href={`/admin/advertisements/${ad.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(ad.id)}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAdvertisementsPage;
