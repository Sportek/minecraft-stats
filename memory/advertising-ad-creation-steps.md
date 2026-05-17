---
name: advertising-ad-creation-steps
description: Étapes et conventions pour créer une publicité dans le panel admin (HTML/CSS, emplacements, tracking)
metadata:
  type: reference
---

Guide pour créer une publicité dans Minecraft Stats. Voir [[advertising-feature-plan]] pour l'architecture.

**Étapes**
1. Menu utilisateur → « Manage advertisements » (visible pour le rôle `admin` uniquement) → page `/admin/advertisements`.
2. « Nouvelle publicité ».
3. **Nom** : libellé interne (non affiché aux visiteurs).
4. **Code HTML / CSS** : voir conventions ci-dessous.
5. **Emplacements** : cocher Page d'accueil et/ou Pages des serveurs (au moins un).
6. **Ciblage par catégorie** (si pages serveur) : aucune catégorie = toutes les pages serveur ; sinon la pub ne s'affiche que pour les catégories cochées.
7. **Poids** : entier 1–1000, rotation pondérée (poids élevé = affichée plus souvent face aux autres pubs).
8. **Début / Fin** : planification optionnelle (datetime-local). Vide = pas de borne.
9. Vérifier la **prévisualisation** (affichée à la largeur réelle du site).
10. Cocher **Activer** puis créer. Suivi des vues/clics/CTR via l'icône stats dans la liste.

**Conventions HTML/CSS impératives**
- La pub est rendue dans une **iframe sandboxée SANS `allow-scripts`** : aucun JavaScript ne s'exécute (`<script>`, `onclick`… sont inertes). HTML + CSS uniquement.
- Le CSS va dans une balise `<style>` ; il est totalement isolé (ne peut pas casser le site).
- **Aucun CSS n'est injecté** par le système : la pub contrôle tout. Elle doit donc inclure son propre reset (`* { margin: 0 }` / `html, body { margin: 0; height: 100% }`) et, si on veut des coins arrondis ou une bordure, les définir elle-même. L'iframe et son conteneur n'ajoutent ni bordure ni `border-radius`.
- **Toute la bannière doit être un seul `<a href="https://...">`** englobant le contenu → 1 lien = 1 clic tracké. Plusieurs `<a>` = plusieurs liens trackés séparément.
- Le `href` doit être en **http(s)**, sur **une seule ligne, sans retour ni espace au milieu** de l'URL (un saut de ligne casse le lien de parrainage ; le backend ne plante plus mais le lien serait erroné).
- Les liens `<a href>` sont réécrits automatiquement vers l'endpoint de redirection traquée — ne pas le faire soi-même.
- Dimensions du slot : pleine largeur du contenu (~1120px desktop) × 130px desktop / 110px mobile. Concevoir responsive (media queries dans le `<style>`), élément racine en `height:100%` pour remplir le slot.
- Privilégier du CSS pur (dégradés, texte) plutôt que des images externes pour la robustesse ; les images hotlinkées restent possibles.
- Champ `type` = 'custom' (pubs maison). Le type 'network' (AdSense/régies, rendu inline) est réservé à la Phase 2.
