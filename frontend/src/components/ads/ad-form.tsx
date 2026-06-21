"use client";

import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import AdPreview from "@/components/ads/ad-preview";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Nom */}
      <div className="space-y-2">
        <Label>
          Nom de la publicité <span className="text-destructive">*</span>
        </Label>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ex. Bannière partenaire Hypixel"
        />
      </div>

      {/* Code HTML/CSS */}
      <div className="space-y-2">
        <Label>
          Code HTML / CSS <span className="text-destructive">*</span>
        </Label>
        <textarea
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          rows={12}
          spellCheck={false}
          placeholder={'<a href="https://exemple.com">\n  <img src="..." alt="..." />\n</a>'}
          className="flex w-full resize-y rounded-md border border-input bg-background px-3 py-2 font-mono text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <p className="text-xs text-muted-foreground">
          Le CSS peut être inclus dans une balise <code>&lt;style&gt;</code>. Le rendu est isolé :
          il ne peut pas casser la mise en page du site. Les liens <code>&lt;a href&gt;</code> sont
          traqués automatiquement.
        </p>
      </div>

      {/* Prévisualisation pleine largeur */}
      <div className="space-y-2">
        <Label>Prévisualisation</Label>
        <AdPreview htmlContent={htmlContent} />
        <p className="text-xs text-muted-foreground">
          Aperçu à la largeur réelle de l&apos;emplacement publicitaire sur le site.
        </p>
      </div>

      {/* Emplacements */}
      <div className="space-y-2">
        <Label>
          Emplacements <span className="text-destructive">*</span>
        </Label>
        <div className="flex flex-wrap gap-4">
          <Label className="flex items-center gap-2 text-sm font-normal text-foreground">
            <Checkbox
              checked={showOnHome}
              onCheckedChange={(checked) => setShowOnHome(checked === true)}
            />
            Page d&apos;accueil
          </Label>
          <Label className="flex items-center gap-2 text-sm font-normal text-foreground">
            <Checkbox
              checked={showOnServer}
              onCheckedChange={(checked) => setShowOnServer(checked === true)}
            />
            Pages des serveurs
          </Label>
        </div>
      </div>

      {/* Ciblage par catégorie */}
      {showOnServer && (
        <div className="space-y-2">
          <Label>Ciblage par catégorie (pages serveur)</Label>
          <p className="text-xs text-muted-foreground">
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
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring ${
                    active
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-secondary text-muted-foreground hover:text-foreground"
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
          <Label>Poids (rotation)</Label>
          <Input
            type="number"
            min={1}
            max={1000}
            value={weight}
            onChange={(e) => setWeight(Math.max(1, Number(e.target.value) || 1))}
          />
          <p className="text-xs text-muted-foreground">Plus élevé = affichée plus souvent.</p>
        </div>
        <div className="space-y-2">
          <Label>Début (optionnel)</Label>
          <Input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Fin (optionnel)</Label>
          <Input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>
      </div>

      {/* Activation */}
      <Label className="flex items-center gap-3 text-sm font-medium text-foreground">
        <Checkbox checked={enabled} onCheckedChange={(checked) => setEnabled(checked === true)} />
        Activer la publicité (visible sur le site)
      </Label>

      {/* Actions */}
      <div className="flex items-center gap-4 border-t border-border pt-4">
        <Button type="submit" variant="accent" disabled={submitting}>
          {submitting ? "Enregistrement..." : submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default AdForm;
