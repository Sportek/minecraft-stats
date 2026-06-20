"use client";

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
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              Gérer les publicités
            </h1>
            <p className="text-gray-600 dark:text-slate-400">
              Créez, activez et suivez les performances de vos bannières publicitaires.
            </p>
          </div>

          <Link
            href="/admin/advertisements/new"
            className="flex items-center gap-2 rounded-md bg-stats-blue-600 px-4 py-2 font-medium text-white shadow-lg shadow-stats-blue-900/20 transition-all hover:bg-stats-blue-500"
          >
            <Plus className="h-5 w-5" />
            <span>Nouvelle publicité</span>
          </Link>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-gray-300 bg-white shadow-xs dark:border-stats-blue-800 dark:bg-stats-blue-1000">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:border-stats-blue-800 dark:bg-stats-blue-950 dark:text-slate-400">
                  <th className="px-6 py-4">Nom</th>
                  <th className="px-6 py-4">Emplacements</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Vues / Clics</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-stats-blue-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-slate-500">
                      Chargement des publicités...
                    </td>
                  </tr>
                ) : ads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-slate-500">
                      Aucune publicité. Cliquez sur «&nbsp;Nouvelle publicité&nbsp;» pour commencer.
                    </td>
                  </tr>
                ) : (
                  ads.map((ad) => (
                    <tr
                      key={ad.id}
                      className="group transition-colors hover:bg-gray-50 dark:hover:bg-stats-blue-900"
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900 dark:text-white">{ad.name}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">
                        {placementLabel(ad)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            ad.enabled
                              ? "border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400"
                              : "border-yellow-500/20 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                          }`}
                        >
                          {ad.enabled ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">
                        {(ad.impressionsCount ?? 0).toLocaleString("fr-FR")} /{" "}
                        {(ad.clicksCount ?? 0).toLocaleString("fr-FR")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggle(ad)}
                            className={`rounded-md p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-stats-blue-500/10 ${
                              ad.enabled
                                ? "text-green-600 dark:text-green-400"
                                : "text-gray-500 dark:text-slate-400"
                            }`}
                            title={ad.enabled ? "Désactiver" : "Activer"}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <Link
                            href={`/admin/advertisements/${ad.id}/stats`}
                            className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-stats-blue-600 dark:text-slate-400 dark:hover:bg-stats-blue-500/10 dark:hover:text-stats-blue-400"
                            title="Statistiques"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/admin/advertisements/${ad.id}/edit`}
                            className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-green-600 dark:text-slate-400 dark:hover:bg-green-500/10 dark:hover:text-green-400"
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(ad.id)}
                            className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
