"use client";

import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import AdPreview from "@/components/ads/ad-preview";
import { Advertisement, AdvertisementInput } from "@/types/advertisement";
import { Category } from "@/types/server";
import { useState } from "react";
import useSWRImmutable from "swr/immutable";

/** Convertit une date ISO en valeur d'input datetime-local (heure locale). */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

const inputClass =
  "w-full bg-white dark:bg-stats-blue-900 border border-gray-300 dark:border-stats-blue-700 rounded-md px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-stats-blue-500/50 focus:border-transparent transition-all";
const labelClass = "block text-sm font-medium text-gray-700 dark:text-slate-300";

interface AdFormProps {
  initial?: Advertisement;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (data: AdvertisementInput) => void;
}

const AdForm = ({ initial, submitting, submitLabel, onSubmit }: AdFormProps) => {
  const { data: categories } = useSWRImmutable<Category[]>(`${getBaseUrl()}/categories`, fetcher);

  const [name, setName] = useState(initial?.name ?? "");
  const [htmlContent, setHtmlContent] = useState(initial?.htmlContent ?? "");
  const [enabled, setEnabled] = useState(initial?.enabled ?? false);
  const [weight, setWeight] = useState(initial?.weight ?? 1);
  const [showOnHome, setShowOnHome] = useState(initial?.showOnHome ?? false);
  const [showOnServer, setShowOnServer] = useState(initial?.showOnServer ?? false);
  const [startsAt, setStartsAt] = useState(toLocalInput(initial?.startsAt));
  const [endsAt, setEndsAt] = useState(toLocalInput(initial?.endsAt));
  const [categoryIds, setCategoryIds] = useState<number[]>(
    initial?.categories?.map((c) => c.id) ?? []
  );
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (id: number) => {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Le nom doit contenir au moins 2 caractères.");
      return;
    }
    if (htmlContent.trim().length === 0) {
      setError("Le code HTML/CSS ne peut pas être vide.");
      return;
    }
    if (!showOnHome && !showOnServer) {
      setError("Sélectionnez au moins un emplacement d'affichage.");
      return;
    }

    onSubmit({
      name: name.trim(),
      htmlContent,
      enabled,
      weight,
      showOnHome,
      showOnServer,
      startsAt: startsAt || null,
      endsAt: endsAt || null,
      categoryIds,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Nom */}
      <div className="space-y-2">
        <label className={labelClass}>
          Nom de la publicité <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ex. Bannière partenaire Hypixel"
          className={inputClass}
        />
      </div>

      {/* Code HTML/CSS */}
      <div className="space-y-2">
        <label className={labelClass}>
          Code HTML / CSS <span className="text-red-500">*</span>
        </label>
        <textarea
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          rows={12}
          spellCheck={false}
          placeholder={'<a href="https://exemple.com">\n  <img src="..." alt="..." />\n</a>'}
          className={`${inputClass} resize-y font-mono text-xs`}
        />
        <p className="text-xs text-gray-500 dark:text-slate-500">
          Le CSS peut être inclus dans une balise <code>&lt;style&gt;</code>. Le rendu est isolé :
          il ne peut pas casser la mise en page du site. Les liens <code>&lt;a href&gt;</code> sont
          traqués automatiquement.
        </p>
      </div>

      {/* Prévisualisation pleine largeur */}
      <div className="space-y-2">
        <label className={labelClass}>Prévisualisation</label>
        <AdPreview htmlContent={htmlContent} />
        <p className="text-xs text-gray-500 dark:text-slate-500">
          Aperçu à la largeur réelle de l&apos;emplacement publicitaire sur le site.
        </p>
      </div>

      {/* Emplacements */}
      <div className="space-y-2">
        <label className={labelClass}>
          Emplacements <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showOnHome}
              onChange={(e) => setShowOnHome(e.target.checked)}
              className="h-4 w-4 accent-stats-blue-600"
            />
            Page d&apos;accueil
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showOnServer}
              onChange={(e) => setShowOnServer(e.target.checked)}
              className="h-4 w-4 accent-stats-blue-600"
            />
            Pages des serveurs
          </label>
        </div>
      </div>

      {/* Ciblage par catégorie */}
      {showOnServer && (
        <div className="space-y-2">
          <label className={labelClass}>Ciblage par catégorie (pages serveur)</label>
          <p className="text-xs text-gray-500 dark:text-slate-500">
            Aucune catégorie sélectionnée = la publicité s&apos;affiche sur toutes les pages
            serveur.
          </p>
          <div className="flex flex-wrap gap-2">
            {(categories ?? []).map((category) => {
              const active = categoryIds.includes(category.id);
              return (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "border-stats-blue-500 bg-stats-blue-600 text-white"
                      : "border-gray-300 bg-gray-100 text-gray-700 dark:border-stats-blue-700 dark:bg-stats-blue-900 dark:text-slate-300"
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Poids + planification */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <label className={labelClass}>Poids (rotation)</label>
          <input
            type="number"
            min={1}
            max={1000}
            value={weight}
            onChange={(e) => setWeight(Math.max(1, Number(e.target.value) || 1))}
            className={inputClass}
          />
          <p className="text-xs text-gray-500 dark:text-slate-500">
            Plus élevé = affichée plus souvent.
          </p>
        </div>
        <div className="space-y-2">
          <label className={labelClass}>Début (optionnel)</label>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <label className={labelClass}>Fin (optionnel)</label>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Activation */}
      <label className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-slate-300">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 accent-stats-blue-600"
        />
        Activer la publicité (visible sur le site)
      </label>

      {/* Actions */}
      <div className="flex items-center gap-4 border-t border-gray-200 pt-4 dark:border-stats-blue-800">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-stats-blue-600 px-6 py-2.5 font-medium text-white shadow-lg shadow-stats-blue-900/20 transition-all hover:bg-stats-blue-500 disabled:opacity-50"
        >
          {submitting ? "Enregistrement..." : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default AdForm;
