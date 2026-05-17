---
name: advertising-feature-plan
description: Plan validé du système de publicités (pubs maison + panel admin + stats)
metadata:
  type: project
---

Système de publicités à construire. Plan validé par le user le 2026-05-16.

**Phasage**
- Phase 1 : IMPLÉMENTÉE le 2026-05-16 (pubs maison HTML/CSS de bout en bout). Migrations à exécuter : `node ace migration:run`.
- Phase 2 (plus tard) : couche réseau (snippet générique AdSense/Media.net/etc. rendu inline) + ID éditeur + consentement RGPD. Le champ `type` ('custom'|'network') existe déjà.

**DB (3 migrations, préfixe 1778400000000+)**
- `advertisements` : name, type ('custom'|'network', défaut 'custom'), html_content, enabled, weight (pondération), show_on_home + show_on_server (booléens — choix pragmatique vs table pivot), starts_at/ends_at (nullable, planification), timestamps.
- `advertisement_categories` : pivot vers `categories`. Vide = toutes catégories ; sinon filtre sur pages serveur.
- `advertisement_events` : log complet — advertisement_id, type ('impression'|'click'), placement, server_id (nullable), target_url (nullable), created_at.

**Backend** : modèles `Advertisement`/`AdvertisementEvent`, `AdvertisementsController` (public: index?placement, impression POST, click GET→302 ; admin: adminIndex/store/update/destroy/stats), `AdvertisementPolicy` (admin only, calquée sur posts). Routes admin dans le groupe `admin` existant. SÉCURITÉ : l'endpoint `click` valide que l'URL `to` fait partie des liens du HTML de la pub (anti open-redirect), retire les caractères de contrôle et normalise via `new URL()` ; le tracking d'évènements est en try/catch (best-effort, ne casse jamais la redirection).

**Frontend** : `src/http/advertisement.ts`, composant `<AdSlot placement="home|server" />` (random pondéré client-side via weight, rendu en `<iframe srcDoc sandbox>` pour isoler le CSS, réécriture des `<a href>` vers /ads/:id/click, beacon impression via sendBeacon). Slot sur `(index)` et `servers/[serverId]`. Panel admin `admin/advertisements` calqué sur `admin/posts` : CRUD, toggle, prévisualisation live (même iframe), vue stats par pub (AG Charts vues vs clics + CTR).

**Décisions tranchées par le user**
- Rendu HTML pubs maison : iframe sandboxée.
- Stats : log d'événements complet.
- Tracking clics : réécriture des liens vers endpoint redirect.
- Fonctions avancées : planification dates, pondération, ciblage par catégorie.
- Pubs réseau : phase 2, snippet générique, impressions seulement côté site.
- Dimensions slot : le slot occupe toute la largeur de contenu du site (RestrictedWidthLayout = max-w-6xl px-4 ≈ 1120px utiles). Iframe haute de 130px desktop / 110px mobile.
- Dédup impressions : 1 impression max par pub / session / **5 min**.

Patron de référence dans le repo : module Blog (`posts`) — controller, policy, routes groupe `admin`, pages `admin/posts`. Rôles user : 'admin'|'writer'|'user'. Pubs = admin only. Voir [[advertising-ad-creation-steps]] pour le mode d'emploi.
