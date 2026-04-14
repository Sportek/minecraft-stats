---
stepsCompleted: [step-01-init, step-02-discovery, step-02-classification, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
completedAt: "2026-04-12"
status: complete
inputDocuments:
  - "Site live: https://minecraft-stats.fr (exploré)"
  - "Logs Discord communauté (juin 2024 - mai 2025)"
workflowType: 'prd'
classification:
  projectType: "Application web SaaS — annuaire/classement communautaire + analytics"
  domain: "Gaming / Communauté Minecraft"
  complexity: "Moyenne-haute"
  projectContext: "brownfield"
stack:
  frontend: "Next.js / React Server Components, Tailwind CSS, AG Charts"
  backend: "AdonisJS (Node.js)"
  hosting: "VPS Pulseheberg (France)"
  auth: "Email + OAuth Google/Discord"
  domaines: "minecraft-stats.fr + minecraft-stats.com (même application)"
  opensource: "https://github.com/Sportek/minecraft-stats"
---

# Product Requirements Document — Minecraft Stats

**Auteur :** Gabriel Landry (Sportek)
**Date :** 2026-04-12
**Version :** 1.0

---

## Résumé Exécutif

Minecraft Stats est une plateforme web internationale de référencement et de classement de serveurs Minecraft, combinant vote communautaire et statistiques de joueurs en temps réel. Accessible via **minecraft-stats.fr** et **minecraft-stats.com** (même application, deux domaines), le produit cible en priorité les **joueurs** à la recherche d'un serveur de qualité. Les propriétaires de serveurs constituent la cible secondaire, attirés par la visibilité qu'apporte le trafic joueurs.

Le pivot stratégique transforme le site d'une plateforme 100% statistique vers un **annuaire de serveurs avec vote communautaire**, en conservant les données analytiques comme différenciateur unique. La monétisation repose sur trois leviers progressifs : affiliation hébergeurs (codes sponsor), publicité programmatique (Google Ads), et mise en avant payante des serveurs (Stripe, Growth).

### Ce qui rend ce produit spécial

Les concurrents directs (minecraft-vote.fr, serveur-minecraft-vote.fr, liste-serveurs.fr) sont des exécutions correctes d'un modèle vieux de 10 ans — liste de votes sans vérification, designs datés, aucune donnée historique. Minecraft Stats est le **seul site à combiner vote communautaire et statistiques réelles longue durée** : courbes de joueurs, croissance hebdomadaire, historique multi-années. Les joueurs évaluent un serveur sur des données vérifiables, pas uniquement sur des votes accumulés.

Trois innovations différenciantes :

1. **Badge "Vérifié"** : les serveurs installant le plugin transmettent leur vrai player count à l'API. Les serveurs qui gonflent leurs chiffres sont exposés.
2. **Classements multi-périodes** (All Time / Annuel / Mensuel, reset le 1er du mois) : dynamique compétitive récurrente qui fidélise joueurs et admins.
3. **Architecture plugin ouverte** : API documentée + plugin officiel open source. Les grands réseaux peuvent construire leur propre intégration sans dépendance tierce.

## Classification du projet

| Attribut | Valeur |
|---|---|
| Type | Application web SaaS — annuaire communautaire + analytics |
| Domaine | Gaming / Communauté Minecraft |
| Complexité | Moyenne-haute |
| Contexte | Brownfield — pivot stats → stats + vote |
| Portée | Internationale (minecraft-stats.fr + minecraft-stats.com) |

## Critères de succès

### Succès utilisateur

- **Joueur :** Trouver un serveur correspondant à ses critères en moins de 2 minutes via les filtres (type, langue, statut)
- **Joueur :** Revenir voter régulièrement — mesuré par le taux de retour des votants à J+1 et J+7
- **Joueur :** Recevoir ses récompenses in-game après chaque vote via le plugin du serveur
- **Admin :** Constater une augmentation du nombre de joueurs entrants traçables depuis le site
- **Admin :** Intégrer le plugin ou l'API de vérification en moins de 30 minutes grâce à la documentation

### Succès business

| Horizon | Métrique | Cible |
|---|---|---|
| 3 mois post-lancement | Visiteurs uniques/mois (Cloudflare) | 50k (+75% vs 28k actuel) |
| 3 mois | Taux de rebond | < 65% (vs 78% actuel) |
| 3 mois | Durée de session moyenne | > 2min (vs 1m06s actuel) |
| 3 mois | Première rentrée d'argent | 1er code affiliation actif |
| 6 mois | Visiteurs uniques/mois | 80k |
| 6 mois | Serveurs avec plugin installé | 50+ |
| 12 mois | Visiteurs uniques/mois | 150k |
| 12 mois | Revenus mensuels récurrents | Premier palier Google Ads viable |

### Résultats mesurables

- Votes totaux émis par mois (indicateur de santé de la communauté)
- Taux de retour des votants sur 7 jours
- Nombre de serveurs avec badge "Vérifié" (adoption du plugin)
- Taux de conversion visiteur → votant

## Cadrage & Roadmap

Le site existe depuis 2 ans avec ~28k visiteurs/mois (Cloudflare) : pas de pression de survie. Le lancement du MVP est une mise à jour majeure du site existant, pas un lancement from scratch. L'approche retenue est un **Experience MVP** — complet, soigné, utile dès le premier contact.

### Phase 1 — MVP (day 1)

**Parcours supportés :** Lucas (trouver un serveur), Alexandre (inscrire/revendiquer/configurer), Théo (intégrer via API), Gabriel (administrer)

- Refonte design complète
- Système de vote (sans compte, cooldown IP+pseudo+serveur, configurable par serveur)
- Classements Mensuel / Annuel / All Time + reset automatique le 1er du mois
- Page d'accueil : liste filtrée (type, langue, statut) + section "Tendances du moment"
- Page serveur : stats historiques + votes + badge Vérifié
- Soumission de serveur ouverte (sans revendication requise)
- Revendication de serveur par vérification DNS TXT (optionnel, débloque le dashboard)
- Dashboard owner complet : configuration cooldown + paliers de récompenses + clé API
- Plugin v1 open source : push player count → badge Vérifié
- API HTTP de vérification des votes (polling) documentée
- API WebSocket pour événements de vote documentée
- Blog SEO et panel admin existants conservés

### Phase 2 — Growth (Post-MVP)

- Système de streak de vote (réduction cooldown selon régularité)
- Récompenses par paliers via plugin v2 (événements in-game)
- Système de parrainage (partage = boost cooldown)
- Codes affiliation hébergeurs
- Mise en avant payante des serveurs (Stripe)

### Phase 3 — Vision

- Google Ads intégré
- Dashboard analytics avancé pour les owners
- Plugin v3 : événements custom avancés
- Programme ambassadeur/communauté

### Risques & mitigation

| Risque | Mitigation |
|---|---|
| Adoption lente du plugin par les admins | Badge Vérifié = incitation — serveurs sans badge paraissent moins fiables |
| Faible revendication des serveurs existants | Campagne email/Discord aux admins connus de la communauté |
| Concurrents qui copient le concept | Avance technique + 2 ans de données historiques = fossé difficile à combler |

## Parcours utilisateurs

### Parcours 1 — Lucas, le joueur qui cherche un serveur

Lucas a 17 ans. Son serveur Faction vient de fermer. Il veut trouver un nouveau serveur actif, en français, avec une communauté réelle — pas un serveur mort affiché à 300 joueurs.

**Scène d'ouverture :** Il tape "meilleur serveur Minecraft français" sur Google. Il tombe sur Minecraft Stats grâce au blog SEO.

**Action :** Sur la page d'accueil, il voit le classement mensuel et la section "Tendances du moment". Il filtre par "Faction" et "Français" — la liste se réduit à une vingtaine de serveurs.

**Moment clé :** Il clique sur le 2e serveur du classement. Il voit la courbe de joueurs des 30 derniers jours : croissance stable, badge "Vérifié" confirmant que les 240 connectés sont réels. Aucun concurrent ne lui montre ça.

**Résolution :** Il rejoint le serveur et revient voter le lendemain. L'interface simple et le classement visible l'ont convaincu.

*Capacités révélées : filtres, classement mensuel, tendances, page serveur enrichie (stats + votes + badge).*

---

### Parcours 2 — Mathieu, le votant régulier

Mathieu joue sur le même serveur Survie depuis 6 mois. L'admin lui a dit que voter sur Minecraft Stats lui donnait des récompenses in-game.

**Scène d'ouverture :** Il vote une première fois et reçoit sa récompense. Le lendemain, il revote. Après 5 jours consécutifs, son cooldown est passé de 24h à 20h — son streak réduit l'attente.

**Moment clé :** Il oublie de voter 2 jours. Son streak tombe, son cooldown remonte. Il réalise que la régularité a une vraie valeur.

**Résolution :** Mathieu est devenu un visiteur quotidien. Sa durée de session a triplé.

*Capacités révélées : système de streak, réduction de cooldown progressive, paliers de récompenses configurables. (Phase 2)*

---

### Parcours 3 — Alexandre, l'admin de serveur

Alexandre gère un serveur Skyblock (~80 joueurs). Il apprécie que le classement mensuel repart à zéro le 1er du mois — ses chances sont égales à celles des grands serveurs.

**Action :** Il inscrit son serveur, configure le cooldown à 12h, et définit trois paliers de récompenses. Il installe le plugin v1 en 20 minutes.

**Moment clé :** Son serveur affiche le badge "Vérifié" — les joueurs voient son vrai compteur, ce qui le différencie des serveurs qui gonflent leurs chiffres.

**Résolution :** Fin du premier mois, 8e dans sa catégorie, 15 nouveaux joueurs attribués au site.

*Capacités révélées : soumission serveur, revendication DNS TXT, dashboard owner, plugin v1, classement par catégorie.*

---

### Parcours 4 — Théo, le développeur intégrateur

Théo est développeur Java dans un grand réseau (~1500 joueurs). Ils ont leur propre système de récompenses et ne veulent pas installer un plugin tiers.

**Action :** Il consulte la documentation de l'API et le code source du plugin officiel (open source). En moins d'une heure, il développe son propre plugin qui s'authentifie via la clé API et intercepte les événements de vote.

**Résolution :** Le plugin passe en production. Badge "Vérifié" obtenu. La transparence open source a été le facteur décisif.

*Capacités révélées : API WebSocket documentée, API HTTP polling, clé API par serveur, plugin open source comme référence.*

---

### Parcours 5 — Gabriel, l'administrateur du site

Gabriel publie un article SEO, modère un serveur suspect, ajuste les rôles d'un utilisateur depuis le panel admin.

*Capacités révélées : panel admin (posts, publish/unpublish, gestion des rôles, modération des serveurs).*

---

### Résumé des capacités par parcours

| Capacité | Parcours |
|---|---|
| Filtres + classement mensuel + tendances | Lucas |
| Page serveur enrichie (stats + votes + badge) | Lucas, Alexandre |
| Système de streak + réduction de cooldown | Mathieu (Phase 2) |
| Paliers de récompenses configurables | Mathieu, Alexandre |
| Soumission + revendication + dashboard owner | Alexandre |
| Plugin v1 (player count → badge Vérifié) | Alexandre |
| API WebSocket + HTTP polling + open source | Théo |
| Panel admin site | Gabriel |

## Exigences spécifiques au domaine

### Conformité & données personnelles (RGPD)

- Les IPs de vote sont des données personnelles. Conservation limitée à la durée du cooldown (max 7 jours), suppression automatique à expiration. Aucune revente. Mention dans les CGU.
- Hébergement VPS France (Pulseheberg) — conforme pour les données européennes.
- Le streak "sans compte" s'appuie sur pseudo + serveur, sans collecte de données supplémentaires au-delà de l'IP temporaire.

### Contraintes anti-abus

- Cooldown par combinaison **IP + pseudo + serveur**. Un joueur peut voter pour plusieurs serveurs différents sans attendre, mais doit respecter le cooldown pour re-voter pour le même serveur.
- La clé API est liée à un serveur spécifique côté backend — un serveur ne peut pas usurper le count d'un autre.
- Le reset mensuel génère un pic de charge le 1er du mois — le classement doit être mis en cache.

### Paiement (Phase 2)

Stripe pour la mise en avant payante. Stripe gère la conformité PCI-DSS — aucune donnée carte ne transite par les serveurs du site.

### Risques techniques identifiés

| Risque | Mitigation |
|---|---|
| Manipulation votes (bots, VPN) | Cooldown IP + pseudo + serveur + monitoring des anomalies |
| Farm de récompenses même pseudo | Cooldown scoped par serveur |
| Faux count via plugin custom | Croisement avec ping serveur existant — divergence = alerte *(question ouverte à résoudre en conception technique)* |
| Pic de charge au reset mensuel | Cache du classement + tests de charge |
| Non-conformité RGPD | Suppression automatique des IPs à expiration du cooldown |

## Innovation & Différenciation

### Innovations identifiées

**1. Vote + données objectives**
Premier site à combiner classement communautaire et statistiques réelles longue durée. Les joueurs évaluent un serveur sur des données vérifiables, pas uniquement sur des votes.

**2. Badge "Vérifié" via plugin**
Vérification du vrai player count via plugin open source — inédit dans l'écosystème. Crée une couche de confiance absente chez tous les concurrents.

**3. Streak de vote (Phase 2)**
Récompenser la régularité par une réduction progressive du cooldown crée une boucle d'engagement absente du marché — et fidélise là où les concurrents subissent 70%+ de taux de rebond.

**4. Architecture ouverte**
API WebSocket + HTTP polling documentées + plugin open source. Les grands réseaux s'intègrent sans dépendance tierce.

### Validation des innovations

| Innovation | Indicateur de succès |
|---|---|
| Badge Vérifié | % de serveurs avec plugin dans les 3 premiers mois |
| Vote + stats | Temps passé sur la page serveur > 1m06s actuel |
| Streak | Taux de retour votants à J+1 et J+7 |

### Risques d'innovation

| Innovation | Risque | Fallback |
|---|---|---|
| Badge Vérifié | Faible adoption | Affichage "Non vérifié" sans pénaliser le serveur |
| Streak | Mécanique incomprise | Onboarding + affichage visuel du cooldown restant |
| Plugin custom | Faux count envoyé | Croisement ping + monitoring — question ouverte |
| API ouverte | Abus / surcharge | Rate limiting + clé API par serveur |

## Architecture technique

### Vue d'ensemble

Next.js (SSR) + AdonisJS (API REST) + endpoint plugin (HTTP push ou WebSocket). Pas de temps réel côté front — toutes les mises à jour sur rechargement de page.

### Modèle de données — votes

- Les votes ne sont jamais supprimés — archivage permanent
- Compteurs calculés : `votes_all_time`, `votes_annual`, `votes_monthly`
- Reset du 1er du mois : remise à 0 du compteur mensuel uniquement, données brutes conservées
- Cooldown : triplet `(ip, pseudo, server_id)` + timestamp d'expiration → suppression automatique à expiration

### Rôles & permissions

| Rôle | Permissions |
|---|---|
| `user` | Voter, consulter, soumettre un serveur |
| `writer` | + Rédiger/éditer des articles de blog |
| `admin` | Accès complet, gestion des rôles, modération |
| `server_owner` | Dashboard serveur : cooldown, récompenses, clé API |

Un owner par serveur. Une personne peut posséder N serveurs. Pas de co-gestionnaires en Phase 1.

### Vérification de propriété des serveurs

~520 serveurs existants ajoutés par des utilisateurs non-admins. La revendication est optionnelle et débloque le dashboard de configuration.

- Token unique généré par serveur : `minecraft-stats-verify=<token>`
- L'owner ajoute le TXT record sur son domaine
- Le backend vérifie la présence du record → serveur lié au compte
- Tous les serveurs ont un domaine — pas d'alternative nécessaire
- Les serveurs non revendiqués restent publics

### Intégration plugin

- **Protocole :** Plugin push → API (HTTP ou WebSocket plugin → backend)
- **Auth :** Clé API par serveur, générée à l'inscription ou la revendication
- **Payload :** `{ server_id, api_key, player_count, timestamp }`
- **Fréquence :** Configurable côté plugin (ex : toutes les 60s)
- **Validation :** Croisement avec le ping serveur existant — divergence > seuil = alerte

### API de vérification des votes (polling)

Endpoint HTTP public accessible via token serveur :

```
GET /api/v1/vote/verify/{token}/{ip}
```

Réponse : `{ has_vote, vote_at, next_vote, remaining_time, pseudo }`

Les deux modes d'intégration (polling HTTP + plugin push) sont documentés et supportés.

### Considérations d'implémentation

- Cron job de reset mensuel (1er du mois à minuit) — idempotent
- Index DB sur `(ip, pseudo, server_id)` pour lookups de cooldown rapides
- Cache du classement avec invalidation partielle au reset

## Exigences fonctionnelles

### Découverte & Navigation

- **FR1 :** Un visiteur peut consulter la liste des serveurs avec filtres par type, langue et statut
- **FR2 :** Un visiteur peut rechercher un serveur par nom
- **FR3 :** Un visiteur peut consulter une section "Tendances du moment" affichant les serveurs en forte progression
- **FR4 :** Un visiteur peut trier la liste par classement Mensuel, Annuel ou All Time
- **FR5 :** Un visiteur peut consulter la page détaillée d'un serveur (informations, statistiques historiques, votes, badge Vérifié)

### Système de vote

- **FR6 :** Un visiteur peut voter pour un serveur sans créer de compte
- **FR7 :** Le système empêche un vote répété pour le même serveur avant expiration du cooldown (IP + pseudo + serveur)
- **FR8 :** Un visiteur peut soumettre son pseudo Minecraft lors du vote
- **FR9 :** Un visiteur peut consulter le temps restant avant de pouvoir re-voter pour un serveur donné
- **FR10 :** Le système calcule et affiche des classements distincts : votes du mois, de l'année, All Time
- **FR11 :** Le système réinitialise automatiquement le compteur mensuel le 1er de chaque mois sans supprimer les données historiques

### Gestion des serveurs

- **FR12 :** N'importe quel utilisateur connecté peut soumettre un nouveau serveur sans en revendiquer la propriété
- **FR13 :** Un utilisateur connecté peut revendiquer un serveur existant via vérification DNS TXT (optionnel, débloque le dashboard)
- **FR14 :** Un owner peut configurer le cooldown de vote de son serveur
- **FR15 :** Un owner peut définir des paliers de récompenses associés à des seuils de votes
- **FR16 :** Un owner peut consulter les statistiques de votes de son serveur
- **FR17 :** Un owner peut gérer les informations de son serveur (nom, description, catégories, langue)
- **FR18 :** Un utilisateur peut posséder plusieurs serveurs depuis un seul compte

### Plugin & Intégration API

- **FR19 :** Un serveur peut envoyer son player count via l'API (push depuis le plugin)
- **FR20 :** Le système affiche un badge "Vérifié" sur les serveurs transmettant leur player count via le plugin
- **FR21 :** Le système alerte en cas de divergence significative entre le count plugin et le ping serveur
- **FR22 :** Un owner peut générer et régénérer sa clé API depuis son dashboard
- **FR23 :** L'API expose des événements de vote interceptables par le plugin pour déclencher des récompenses in-game
- **FR24 :** Le système expose une API HTTP publique de vérification des votes (réponse : `has_vote`, `vote_at`, `next_vote`, `remaining_time`, `pseudo`) accessible via token serveur
- **FR25 :** Les deux modes d'intégration sont documentés et supportés : API HTTP polling et plugin push

### Authentification & Comptes

- **FR26 :** Un visiteur peut créer un compte via email/mot de passe, Google ou Discord
- **FR27 :** Un utilisateur connecté peut modifier son profil et son mot de passe
- **FR28 :** Le système vérifie l'adresse email lors de l'inscription

### Contenu & SEO

- **FR29 :** Un writer peut créer, modifier et prévisualiser des articles de blog
- **FR30 :** Un admin peut publier et dépublier des articles de blog
- **FR31 :** Les pages serveurs et les articles de blog sont indexables par les moteurs de recherche (SSR, métadonnées, sitemap)

### Administration

- **FR32 :** Un admin peut consulter et gérer la liste des utilisateurs
- **FR33 :** Un admin peut modifier les rôles des utilisateurs (user, writer, admin)
- **FR34 :** Un admin peut modérer les serveurs (désactivation, suppression)
- **FR35 :** Un admin peut uploader des images via le système d'upload centralisé

### Partenaires & Monétisation (base MVP)

- **FR36 :** Un visiteur peut consulter la page partenaires avec les offres et codes affiliés des hébergeurs

## Exigences non-fonctionnelles

### Performance

- **NFR1 :** LCP de la page d'accueil < 2 secondes sur connexion standard
- **NFR2 :** Requêtes API de consultation (liste, classement, page serveur) < 500ms hors pics
- **NFR3 :** Endpoint de vote < 300ms pour un retour immédiat au joueur
- **NFR4 :** Le classement est mis en cache — invalidation partielle au reset mensuel

### Sécurité

- **NFR5 :** Toutes les communications chiffrées en transit (HTTPS/TLS)
- **NFR6 :** Les clés API des serveurs sont hachées en base de données — jamais stockées en clair
- **NFR7 :** Les endpoints de vote et d'inscription sont protégés par rate limiting
- **NFR8 :** Les IPs de vote supprimées automatiquement après expiration du cooldown (max 7 jours) — conformité RGPD
- **NFR9 :** Le système de paiement futur (Stripe) ne transmet jamais de données de carte via les serveurs du site

### Scalabilité

- **NFR10 :** L'infrastructure supporte un pic de charge x5 le trafic moyen lors du reset mensuel
- **NFR11 :** L'ajout de nouveaux serveurs n'impacte pas les performances du classement (index DB appropriés)
- **NFR12 :** L'API de vérification des votes supporte des appels fréquents par token serveur (rate limiting documenté)

### Fiabilité

- **NFR13 :** Disponibilité API ≥ 99.5% hors maintenance planifiée
- **NFR14 :** Le cron job de reset mensuel est idempotent — plusieurs exécutions ne corrompent pas les données
- **NFR15 :** Les données de votes historiques ne sont jamais supprimées lors de maintenances

### Intégration

- **NFR16 :** Le plugin officiel est compatible Bukkit/Spigot/Paper — versions récentes et deux dernières LTS
- **NFR17 :** L'API REST respecte le versioning (`/api/v1/`) pour ne pas casser les intégrations existantes
