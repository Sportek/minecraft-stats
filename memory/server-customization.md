---
name: server-customization
description: Personnalisation de fiche pour les owners vérifiés (bannière 468x60, style du titre, effets de carte) — décisions produit, périmètre livré, suite prévue
metadata:
  type: project
---

Feature demandée le 2026-09-19 : donner des avantages aux owners de serveurs **vérifiés**
(`ownerVerifiedAt !== null`). Première tranche = personnalisation visuelle de la fiche.
Livrée et vérifiée (tests backend, capture réelle clair/sombre + survol), **non commitée** à la
fin de la session.

**Décisions produit tranchées par le user**
- Bannière **468×60 exactement** (format standard des sites de vote), image fixe ou GIF animé
  (stocké en WebP animé). Pas de recadrage auto : dimensions fausses = 422.
- Sur la **home** la bannière est le **bandeau de couverture de la carte** : tout en haut, pleine
  largeur (`-mx-4 -mt-4`), coins arrondis alignés sur la carte, toujours visible ; le graphique garde sa
  place. Abandonné : la bannière qui remplaçait la sparkline et s'effaçait au survol — le user l'a jugée
  « tash » (petit bandeau collé au milieu d'une carte dense, texte illisible, et il disparaissait).
  Écartées aussi : mini-courbe + bannière fixe, carte large 2 colonnes (casse la grille et l'ordre du
  classement), pas de bannière dans la grille.
- Sur la **fiche** : fond = bannière agrandie/floutée + bannière nette à taille réelle dans l'en-tête.
- Titre : 9 polices (liste blanche `TITLE_FONTS`) + couleur unie ou dégradé (deux hex). La police
  « Minecraft » est **Monocraft** (SIL OFL 1.1, `frontend/src/fonts/monocraft/`, sous-ensemble WOFF 26 Ko) :
  la vraie police du jeu (Mojangles) n'est pas publiée par Mojang, ne jamais l'embarquer.
- Effets de carte, lot 1 : `frost`, `enchanted`, `embers`, `neon` (CSS pur, `src/app/card-effects.css`
  + 3 calques injectés par `<CardEffectLayers>`). `neon` reprend la couleur du titre. Refaits une
  fois : la 1re version (voiles translucides) a été jugée « à chier » par le user.
- **Ne pas** ajouter de lumière qui suit le curseur au survol : le user n'aime pas (retirée).
- **Modération** : publication immédiate + retrait par un admin (pas de file `pending`).

**Why (contraintes techniques non évidentes)**
- Colonnes nullables sur `servers` (pas de table dédiée) : les cartes de la home les lisent à chaque
  page de classement, une jointure serait payée à chaque requête.
- Polices/effets = clés d'une liste blanche, couleurs = `#rrggbb` validé : rien de libre n'atteint un
  attribut `style`. Ajouter une police/un effet = backend `constants/server_customization.ts` **et**
  frontend (`lib/server-customization.ts`, `lib/title-fonts.ts`, `card-effects.css`, messages i18n).
- `next/font/google` exige des littéraux à chaque appel (pas de spread d'options partagées).
- Le retrait de bannière (`DELETE /servers/:id/banner`) est sous `update` (owner même non vérifié, ou
  admin) ; le reste sous `customize` (owner vérifié ou admin). L'admin retire une bannière abusive via
  la page `/servers/:id/edit`, pas de bouton dédié sur la fiche publique.
- Sharp animé : `metadata().height` cumule les frames, il faut lire `pageHeight ?? height`.
  `metadata()` ne lit que l'en-tête : une image tronquée ne casse qu'à l'encodage (gérer les deux).

- Chaque effet est construit deux fois : sombre = émissif (lueurs, `screen`), clair = pigmentaire
  (carte teintée, `multiply`, ombres colorées). Une lumière additive est invisible sur fond blanc.
- **Jamais `overflow: hidden` sur la carte** : le bouton « modifier » (`top/right: -5px`), le popup
  des drapeaux et l'info-bulle dépassent volontairement. Les calques se clippent eux-mêmes.
- Les animations se mettent en pause hors écran (`data-fx-idle`) : pour capturer un effet, faire
  défiler jusqu'à la carte avant, sinon on photographie l'instant 0.

**Reste à faire / idées non traitées**
- Bouton admin « retirer la bannière » directement sur la fiche publique.
- Autres effets (idées : aurore, neige/pétales, glitch, prisme holographique, lucioles), trailer YouTube, description riche, liens sociaux (phase suivante prévue par le user).
- Rien n'empêche encore un titre illisible (couleur proche du fond) : le choix est laissé à l'owner.

**Vérifier visuellement** : l'extension Chrome n'était pas connectée ; Chrome headless piloté en CDP
depuis Node (WebSocket natif) a suffi — thème via `localStorage.theme`, jeton via
`localStorage.accessToken`, survol via `Input.dispatchMouseEvent`. Voir [[local-dev-database]] pour la
base locale (stats du dump périmées : forcer `last_stats_at = now()` pour faire remonter un serveur de
test en tête de la home, puis restaurer).
