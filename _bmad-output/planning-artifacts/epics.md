---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-stories-epic-0, step-03-stories-epic-1, step-03-stories-epic-2, step-03-stories-epic-3, step-03-stories-epic-4, step-03-stories-epic-5, step-04-final-validation]
status: complete
completedAt: '2026-04-13'
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
---

# Minecraft Stats - Epic Breakdown

## Overview

Ce document décompose les exigences du PRD et de l'Architecture en epics et stories implémentables pour Minecraft Stats.

## Requirements Inventory

### Functional Requirements

FR1: Un visiteur peut consulter la liste des serveurs avec filtres par type, langue et statut
FR2: Un visiteur peut rechercher un serveur par nom
FR3: Un visiteur peut consulter une section "Tendances du moment" affichant les serveurs en forte progression (score composite : weekly_growth × 0.6 + delta_votes_7j × 0.4)
FR4: Un visiteur peut trier la liste par classement Mensuel, Annuel ou All Time
FR5: Un visiteur peut consulter la page détaillée d'un serveur (informations, statistiques historiques, votes)
FR6: Un visiteur peut voter pour un serveur sans créer de compte
FR7: Le système empêche un vote répété pour le même serveur avant expiration du cooldown (IP + pseudo + serveur)
FR8: Un visiteur soumet son pseudo Minecraft lors du vote
FR9: Un visiteur peut consulter le temps restant avant de pouvoir re-voter pour un serveur donné
FR10: Le système calcule et affiche des classements distincts : votes du mois, de l'année, All Time
FR11: Le système réinitialise automatiquement le compteur mensuel le 1er de chaque mois sans supprimer les données historiques
FR12: N'importe quel utilisateur connecté peut soumettre un nouveau serveur sans en revendiquer la propriété
FR13: Un utilisateur connecté peut revendiquer un serveur existant via vérification DNS TXT (débloque le dashboard owner)
FR14: Un owner peut configurer le cooldown de vote de son serveur
FR15: Un owner peut définir des paliers de récompenses associés à des seuils de votes (table server_reward_tiers)
FR16: Un owner peut consulter les statistiques de votes de son serveur
FR17: Un owner peut gérer les informations de son serveur (nom, description, catégories, langue)
FR18: Un utilisateur peut posséder plusieurs serveurs depuis un seul compte
FR19: [HORS SCOPE MVP — Phase 3] Push player count via API plugin
FR20: [HORS SCOPE MVP — Phase 3] Badge "Vérifié"
FR21: [HORS SCOPE MVP — Phase 3] Alerte divergence count plugin vs ping
FR22: Un owner peut générer et régénérer sa clé API depuis son dashboard
FR23: L'API expose des événements de vote interceptables par le plugin pour déclencher des récompenses in-game
FR24: Le système expose une API HTTP publique de vérification des votes (has_vote, vote_at, next_vote_at, pseudo, total_votes) accessible via token serveur
FR25: Les deux modes d'intégration sont documentés : API HTTP polling (recommandé) + WebSocket (Phase 2)
FR26: Un visiteur peut créer un compte via email/mot de passe, Google ou Discord [EXISTANT]
FR27: Un utilisateur connecté peut modifier son profil et son mot de passe [EXISTANT]
FR28: Le système vérifie l'adresse email lors de l'inscription [EXISTANT]
FR29: Un writer peut créer, modifier et prévisualiser des articles de blog [EXISTANT]
FR30: Un admin peut publier et dépublier des articles de blog [EXISTANT]
FR31: Les pages serveurs et articles de blog sont indexables par les moteurs de recherche [EXISTANT]
FR32: Un admin peut consulter et gérer la liste des utilisateurs [EXISTANT]
FR33: Un admin peut modifier les rôles des utilisateurs [EXISTANT]
FR34: Un admin peut modérer les serveurs (désactivation, suppression) [EXISTANT]
FR35: Un admin peut uploader des images [EXISTANT]
FR36: Un visiteur peut consulter la page partenaires avec les offres et codes affiliés des hébergeurs

### NonFunctional Requirements

NFR1: LCP de la page d'accueil < 2 secondes sur connexion standard
NFR2: Requêtes API de consultation (liste, classement, page serveur) < 500ms hors pics
NFR3: Endpoint de vote < 300ms pour un retour immédiat au joueur
NFR4: Le classement est mis en cache Redis — invalidation partielle au reset mensuel
NFR5: Toutes les communications chiffrées en transit (HTTPS/TLS) [EXISTANT]
NFR6: Les clés API des serveurs sont hachées en base de données (Argon2)
NFR7: Les endpoints de vote et d'inscription sont protégés par rate limiting
NFR8: Les IPs de vote supprimées automatiquement après expiration du cooldown (max 7 jours) — conformité RGPD
NFR9: [Phase 2] Stripe — aucune donnée carte via les serveurs du site
NFR10: L'infrastructure supporte un pic de charge x5 au reset mensuel
NFR11: L'ajout de nouveaux serveurs n'impacte pas les performances du classement (index DB appropriés)
NFR12: L'API de vérification des votes supporte des appels fréquents par token serveur (rate limiting documenté)
NFR13: Disponibilité API ≥ 99.5% hors maintenance planifiée [EXISTANT]
NFR14: Le cron job de reset mensuel est idempotent — plusieurs exécutions ne corrompent pas les données
NFR15: Les données de votes historiques ne sont jamais supprimées lors de maintenances
NFR16: Le plugin officiel est compatible Bukkit/Spigot/Paper — versions récentes et deux dernières LTS
NFR17: L'API REST respecte le versioning (/api/v1/) pour ne pas casser les intégrations existantes [EXISTANT]

### Additional Requirements

- **AR1 — Migration AdonisJS v6 → v7** : à effectuer en Sprint 0, avant toute nouvelle feature. Vérifier compatibilité : Ally, Lucid, adonisjs-scheduler, @adonisjs/limiter, adonis-autoswagger, @julr/adonisjs-prometheus
- **AR2 — Cooldown Redis + PostgreSQL** : Redis comme lookup principal (TTL natif), PostgreSQL comme source de vérité et fallback en cas de crash Redis. Clé Redis : `cooldown:{ip}:{pseudo}:{server_id}`
- **AR3 — Validation pseudo Minecraft** : regex `^[a-zA-Z0-9_]{3,16}$` obligatoire dans vote_validator.ts (backend) ET dans le plugin officiel (défense en profondeur)
- **AR4 — Ownership dual** : `servers.user_id` = soumetteur (existant), `servers.claimed_by_id` = propriétaire vérifié DNS TXT (nouveau). Dashboard accessible uniquement si `claimed_by_id = auth.user.id`
- **AR5 — Trending score** : nouvelle colonne `trending_score` dans `server_growth_stats`, calculée toutes les 6h par le scheduler : `(weekly_growth_% × 0.6) + (delta_votes_7j_vs_mois_précédent_% × 0.4)`
- **AR6 — Auth plugin** : header `X-Api-Key`, clé hashée en DB (Argon2), scopée à un `server_id`, middleware dédié `api_key_middleware.ts`
- **AR7 — Cron reset mensuel** : idempotent, remet `votes_monthly` à 0 + invalide `ranking:monthly` dans Redis. Cron purge RGPD quotidien : `SET ip = NULL WHERE expires_at < NOW()`
- **AR8 — total_votes dans polling** : `GET /api/v1/vote/verify/:token/:pseudo` retourne `total_votes` (COUNT votes par pseudo + server_id) pour permettre aux serveurs de gérer des systèmes de rang

### UX Design Requirements

Aucun document UX — non applicable.

### FR Coverage Map

| FR | Epic |
|---|---|
| FR1, FR2, FR4, FR5 | Epic 2 — Découverte & comparaison serveurs |
| FR3, FR10 | Epic 2 — Classements & Tendances |
| FR6, FR7, FR8, FR9, FR11 | Epic 1 — Vote |
| FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR22 | Epic 3 — Dashboard owner |
| FR23, FR24, FR25 | Epic 4 — Plugin & récompenses |
| FR26–FR35 | Existant — conservé (pas d'epic) |
| FR36 | Epic 5 — Partenaires |
| FR19, FR20, FR21 | Hors scope MVP — Phase 3 |
| AR1 | Epic 0 — Migration |
| AR2, AR3, AR7 | Epic 1 — Vote |
| AR5 | Epic 2 — Tendances |
| AR4, AR6 | Epic 3 — Dashboard owner |
| AR8 | Epic 4 — Plugin |

## Epic List

### Epic 0 : Migration AdonisJS v6 → v7
Prérequis technique — le site existant continue de fonctionner et les nouvelles features peuvent être buildées sur une base à jour.
**FRs couverts :** AR1

### Epic 1 : Voter pour un serveur
Un joueur peut voter pour un serveur sans créer de compte, soumettre son pseudo, consulter son cooldown restant, et le système prévient les votes multiples via Redis + PostgreSQL. Le reset mensuel automatique et la purge RGPD des IPs sont actifs.
**FRs couverts :** FR6, FR7, FR8, FR9, FR11 — AR2, AR3, AR7 — NFR3, NFR7, NFR8, NFR14, NFR15

### Epic 2 : Découvrir et comparer les serveurs
Un joueur peut filtrer la liste par type/langue/statut, rechercher par nom, trier par classements Mensuel/Annuel/All Time, consulter les "Tendances du moment", et voir une page serveur enrichie avec statistiques historiques et votes.
**FRs couverts :** FR1, FR2, FR3, FR4, FR5, FR10, FR31 — AR5 — NFR1, NFR2, NFR4, NFR10, NFR11

### Epic 3 : Revendiquer et configurer son serveur
Un admin peut revendiquer son serveur via vérification DNS TXT, configurer le cooldown de vote, définir des paliers de récompenses, régénérer sa clé API, et consulter les statistiques de votes de son serveur.
**FRs couverts :** FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR22 — AR4, AR6 — NFR6

### Epic 4 : Plugin & récompenses in-game
Un plugin Java peut interroger l'API pour détecter si un joueur a voté, connaître son total de votes, et déclencher automatiquement des récompenses in-game configurées par l'owner.
**FRs couverts :** FR23, FR24, FR25 — AR8 — NFR12, NFR16, NFR17

### Epic 5 : Page partenaires
Les visiteurs peuvent consulter les offres et codes affiliés des hébergeurs partenaires.
**FRs couverts :** FR36

---

## Epic 0 : Migration AdonisJS v6 → v7

Le codebase tourne sur AdonisJS v7 sans régression sur les features existantes. Prérequis de tous les epics suivants.

### Story 0.1 : Audit de compatibilité v6 → v7

En tant que **développeur**,
je veux identifier tous les breaking changes entre AdonisJS v6 et v7 et l'état de compatibilité de chaque package,
afin de planifier la migration sans surprise.

**Acceptance Criteria:**

**Given** le projet utilise AdonisJS v6 avec les packages : Ally v5, Lucid v21, adonisjs-scheduler, @adonisjs/limiter, adonis-autoswagger, @julr/adonisjs-prometheus
**When** l'audit est effectué
**Then** un document liste chaque package avec : version actuelle, version v7 compatible (ou alternative), breaking changes connus
**And** les packages sans support v7 ont une alternative identifiée ou une décision documentée (garder, remplacer, supprimer)

### Story 0.2 : Migration du core AdonisJS

En tant que **développeur**,
je veux migrer le core d'AdonisJS v6 vers v7 (kernel, routes, middleware, providers),
afin que l'application démarre et réponde correctement sur v7.

**Acceptance Criteria:**

**Given** l'audit de la Story 0.1 est terminé
**When** la migration du core est appliquée
**Then** `node ace serve` démarre sans erreur sur AdonisJS v7
**And** tous les endpoints existants (`/api/v1/servers`, `/api/v1/posts`, auth) répondent correctement
**And** les middlewares (auth, CORS, rate limiting) fonctionnent

### Story 0.3 : Migration des packages tiers

En tant que **développeur**,
je veux migrer tous les packages tiers vers leurs versions v7 compatibles,
afin que toutes les fonctionnalités existantes (OAuth, ORM, scheduler, rate limiting) soient opérationnelles.

**Acceptance Criteria:**

**Given** le core v7 tourne (Story 0.2)
**When** chaque package est mis à jour selon l'audit
**Then** OAuth Google et Discord fonctionnent (login + callback)
**And** les queries Lucid (servers, users, posts, stats) retournent les bons résultats
**And** le scheduler (pings 10min, recalcul growth 6h) s'exécute correctement
**And** le rate limiting est actif sur tous les endpoints existants
**And** la doc Swagger est accessible sur `/docs`

### Story 0.4 : Tests de régression et validation finale

En tant que **développeur**,
je veux valider que l'ensemble du site existant fonctionne identiquement après la migration,
afin de déployer v7 en production en confiance.

**Acceptance Criteria:**

**Given** tous les packages sont migrés (Story 0.3)
**When** la validation complète est effectuée
**Then** la liste des serveurs, la page serveur, les stats AG Charts, le blog et le panel admin fonctionnent sur le frontend
**And** l'inscription email, Google et Discord fonctionnent end-to-end
**And** les métriques Prometheus sont exposées sur `/metrics`
**And** aucune régression détectée sur les deux domaines (.fr et .com)

---

## Epic 1 : Voter pour un serveur

Un joueur peut voter pour un serveur sans créer de compte, soumettre son pseudo, voir son cooldown restant. Le système prévient les votes multiples et assure la conformité RGPD.

### Story 1.1 : Table votes et service de cooldown

En tant que **système**,
je veux une table `votes` en PostgreSQL et un `VoteService` gérant le cooldown via Redis (primary) + PostgreSQL (fallback),
afin que les votes soient persistés et les doublons prévenus en moins de 300ms.

**Acceptance Criteria:**

**Given** la migration v7 est complète (Epic 0)
**When** la migration DB est exécutée
**Then** la table `votes` existe avec les colonnes : `id`, `server_id`, `pseudo` (varchar 16), `ip` (varchar 45), `expires_at`, `created_at`
**And** les index `idx_votes_ip_pseudo_server`, `idx_votes_server_created`, `idx_votes_expires` sont créés
**And** `VoteService.checkCooldown(ip, pseudo, serverId)` retourne `{ allowed: boolean, remainingSeconds: number }` en consultant Redis d'abord, PostgreSQL en fallback
**And** `VoteService.recordVote(ip, pseudo, serverId, cooldownSeconds)` insère en PostgreSQL ET set la clé Redis `cooldown:{ip}:{pseudo}:{server_id}` avec TTL = cooldownSeconds
**And** le pseudo est validé par regex `^[a-zA-Z0-9_]{3,16}$` avant toute opération

### Story 1.2 : Endpoint POST /api/v1/servers/:id/vote

En tant que **visiteur**,
je veux pouvoir voter pour un serveur via l'API en soumettant mon pseudo,
afin que mon vote soit enregistré et que je sache quand je peux re-voter.

**Acceptance Criteria:**

**Given** la Story 1.1 est complète
**When** `POST /api/v1/servers/:id/vote` est appelé avec `{ pseudo: "Sportek" }`
**Then** si le cooldown n'est pas expiré → HTTP 429 avec `{ error: "COOLDOWN_ACTIVE", remaining_seconds: N, next_vote_at: "ISO8601" }`
**And** si le pseudo est invalide → HTTP 422 avec `{ error: "INVALID_PSEUDO" }`
**And** si le serveur n'existe pas → HTTP 404
**And** si tout est valide → HTTP 201, vote enregistré, cooldown Redis + PostgreSQL créé
**And** l'endpoint répond en < 300ms (NFR3)
**And** l'endpoint est rate-limité à 10 requêtes/minute par IP dans `start/limiter.ts`

### Story 1.3 : Interface de vote (VoteButton, VoteModal, VoteCooldown)

En tant que **visiteur**,
je veux voir un bouton de vote sur la page d'un serveur, saisir mon pseudo dans une modale, et voir le temps restant avant de pouvoir re-voter,
afin de voter facilement et savoir quand revenir.

**Acceptance Criteria:**

**Given** l'endpoint de vote de la Story 1.2 est disponible
**When** le visiteur visite la page d'un serveur
**Then** un bouton "Voter" est affiché
**And** au clic, une modale s'ouvre demandant le pseudo Minecraft
**And** si le pseudo est invalide côté client (regex), un message d'erreur s'affiche avant envoi
**And** après un vote réussi, le bouton est remplacé par un timer `VoteCooldown` affichant le temps restant en H:MM:SS
**And** si le joueur a déjà voté (cooldown actif), le timer est affiché directement sans bouton
**And** le pseudo saisi est mémorisé en localStorage pour pré-remplir la prochaine fois

### Story 1.4 : Cron reset mensuel et purge RGPD

En tant que **système**,
je veux un cron job de reset mensuel idempotent et une purge quotidienne des IPs expirées,
afin que les classements mensuels repartent à zéro le 1er du mois et que la conformité RGPD soit respectée.

**Acceptance Criteria:**

**Given** la table `votes` existe (Story 1.1)
**When** le cron de reset s'exécute le 1er du mois à 00h00
**Then** le compteur mensuel des votes est remis à zéro
**And** la clé Redis `ranking:monthly` est invalidée
**And** une double exécution du cron ne corrompt pas les données (idempotent)
**And** les données brutes de la table `votes` ne sont jamais supprimées
**When** le cron quotidien RGPD s'exécute
**Then** `UPDATE votes SET ip = NULL WHERE expires_at < NOW()` est exécuté
**And** les clés Redis expirées sont supprimées automatiquement par leur TTL natif

---

## Epic 2 : Découvrir et comparer les serveurs

Un joueur peut trier par classements Mensuel/Annuel/All Time, voir les "Tendances du moment", et consulter une page serveur enrichie avec le nombre de votes.

### Story 2.1 : RankingService — cache Redis des classements

En tant que **système**,
je veux un `RankingService` qui calcule et met en cache les classements Mensuel/Annuel/All Time dans Redis,
afin que les requêtes de classement répondent en < 500ms même lors du pic de charge x5 au reset mensuel.

**Acceptance Criteria:**

**Given** la table `votes` existe (Epic 1)
**When** `RankingService.getRanking(period)` est appelé avec `period` = `monthly | annual | all_time`
**Then** le classement est servi depuis Redis (`ranking:monthly`, `ranking:annual`, `ranking:all_time`) si disponible
**And** en cas de miss Redis, le classement est calculé depuis PostgreSQL et mis en cache
**And** le cron de reset mensuel invalide uniquement `ranking:monthly` (pas les autres périodes)
**And** `GET /api/v1/servers?sort=monthly|annual|all_time` utilise ce service et répond en < 500ms (NFR2)

### Story 2.2 : Calcul et cache du trending score

En tant que **système**,
je veux que le scheduler calcule un `trending_score` composite pour chaque serveur toutes les 6h,
afin que la section "Tendances du moment" affiche les serveurs réellement en progression.

**Acceptance Criteria:**

**Given** `server_growth_stats` contient `weekly_growth` et `monthly_context_growth`
**When** le scheduler toutes les 6h exécute le calcul
**Then** une colonne `trending_score` est ajoutée à `server_growth_stats` via migration
**And** `trending_score = (weekly_growth × 0.6) + (delta_votes_7j_vs_mois_précédent × 0.4)`
**And** `GET /api/v1/servers/trending` retourne les N serveurs avec le `trending_score` le plus élevé
**And** les serveurs sans données de votes récents ont un `trending_score` de 0

### Story 2.3 : Page d'accueil — classements et tendances

En tant que **visiteur**,
je veux voir les classements Mensuel/Annuel/All Time et une section "Tendances du moment" sur la page d'accueil,
afin de découvrir les meilleurs serveurs et ceux qui montent fort.

**Acceptance Criteria:**

**Given** le RankingService (Story 2.1) et le trending score (Story 2.2) sont disponibles
**When** le visiteur arrive sur la page d'accueil
**Then** des onglets `Mensuel / Annuel / All Time` permettent de basculer entre les classements
**And** chaque ligne du classement affiche le rang, nom du serveur, nombre de votes pour la période sélectionnée, et nombre de joueurs connectés
**And** une section "Tendances du moment" affiche les serveurs avec le trending_score le plus élevé
**And** les filtres existants (type, langue, statut) et la recherche restent fonctionnels
**And** la page est rendue en SSR et le LCP est < 2s (NFR1)

### Story 2.4 : Page serveur enrichie avec votes

En tant que **visiteur**,
je veux voir le nombre de votes (mensuel, annuel, all time) et la position dans le classement sur la page d'un serveur,
afin d'évaluer sa popularité au-delà des seules statistiques de joueurs connectés.

**Acceptance Criteria:**

**Given** la table `votes` contient des données (Epic 1)
**When** le visiteur consulte la page d'un serveur
**Then** le nombre de votes mensuel, annuel et all time est affiché
**And** la position du serveur dans le classement mensuel courant est affichée (ex : "#12 ce mois-ci")
**And** les statistiques de joueurs historiques (AG Charts existant) restent présentes
**And** les métadonnées SEO de la page incluent les votes pour l'indexation (FR31)

---

## Epic 3 : Revendiquer et configurer son serveur

Un admin peut revendiquer son serveur via DNS TXT, configurer le cooldown, définir des paliers de récompenses, régénérer sa clé API, et consulter ses stats de votes.

### Story 3.1 : Système de revendication DNS TXT

En tant qu'**admin de serveur**,
je veux revendiquer mon serveur en ajoutant un record DNS TXT sur mon domaine,
afin de prouver que je suis le vrai propriétaire et débloquer le dashboard de configuration.

**Acceptance Criteria:**

**Given** un serveur existe dans la DB avec `claimed_by_id = NULL`
**When** un utilisateur connecté accède au flux de revendication
**Then** le système génère un `claim_token` unique et l'affiche sous forme de record TXT à ajouter : `minecraft-stats-verify=<token>`
**And** quand l'utilisateur clique "Vérifier", le backend fait un DNS TXT lookup sur le domaine du serveur
**And** si le record est présent et correct → `servers.claimed_by_id = auth.user.id`, `servers.claimed_at = NOW()`
**And** si absent → HTTP 422 avec `{ error: "DNS_VERIFICATION_FAILED", expected_record: "minecraft-stats-verify=<token>" }`
**And** la migration ajoute les colonnes `claim_token`, `claimed_by_id` (FK users), `claimed_at` à la table `servers`
**And** `servers.user_id` (soumetteur original) reste inchangé

### Story 3.2 : Dashboard owner — cooldown et infos serveur

En tant qu'**owner d'un serveur revendiqué**,
je veux configurer le cooldown de vote et les informations de mon serveur depuis mon dashboard,
afin de contrôler la fréquence de vote et garder ma fiche à jour.

**Acceptance Criteria:**

**Given** `servers.claimed_by_id = auth.user.id`
**When** l'owner accède à `/account/servers/:id`
**Then** un formulaire permet de sélectionner le cooldown (1h, 6h, 12h, 24h)
**And** la modification est sauvegardée via `PUT /api/v1/servers/:id` (endpoint existant, protégé par policy `claimed_by_id`)
**And** un formulaire permet de modifier nom, description, catégories, langue du serveur (FR17)
**And** un utilisateur non-owner (ni `claimed_by_id`, ni admin) reçoit HTTP 403
**And** un owner peut posséder plusieurs serveurs listés dans `/account/dashboard` (FR18)

### Story 3.3 : Dashboard owner — paliers de récompenses

En tant qu'**owner d'un serveur revendiqué**,
je veux définir des paliers de récompenses avec plusieurs commandes associées à des seuils de votes,
afin de motiver les joueurs à voter régulièrement en leur offrant des récompenses in-game variées.

**Acceptance Criteria:**

**Given** `servers.claimed_by_id = auth.user.id`
**When** l'owner accède à la section récompenses de son dashboard
**Then** la migration a créé la table `server_reward_tiers` avec : `id`, `server_id`, `votes_threshold`, `label`, `reward_commands TEXT[]`, `created_at`
**And** `POST /api/v1/servers/:id/reward-tiers` crée un palier avec un tableau de commandes (owner uniquement)
**And** `PUT /api/v1/servers/:id/reward-tiers/:tid` modifie un palier
**And** `DELETE /api/v1/servers/:id/reward-tiers/:tid` supprime un palier
**And** `GET /api/v1/servers/:id/reward-tiers` est public et retourne `reward_commands` comme tableau JSON
**And** l'UI permet d'ajouter et supprimer des commandes individuellement dans le formulaire d'un palier
**And** `reward_commands` est stocké tel quel — la substitution de `{player}` est faite par le plugin après validation regex

### Story 3.4 : Dashboard owner — clé API et stats de votes

En tant qu'**owner d'un serveur revendiqué**,
je veux générer une clé API et consulter les statistiques de votes de mon serveur,
afin d'intégrer le plugin et suivre les performances de mes campagnes de vote.

**Acceptance Criteria:**

**Given** `servers.claimed_by_id = auth.user.id`
**When** l'owner accède à la section clé API
**Then** `POST /api/v1/servers/:id/api-key` génère une clé, la retourne en clair une seule fois, et stocke son hash Argon2 dans `servers.api_key_hash` (NFR6)
**And** une régénération invalide l'ancienne clé immédiatement
**And** la clé n'est jamais retournée en clair après la génération initiale
**And** `GET /api/v1/servers/:id/votes/stats` retourne les totaux mensuel, annuel, all time (FR16)
**And** un graphique simple affiche l'évolution des votes sur les 30 derniers jours

---

## Epic 4 : Plugin & récompenses in-game

Un plugin Java peut détecter les votes à la connexion ou sur commande, et déclencher automatiquement les récompenses in-game configurées par l'owner. L'API de polling est aussi consommable par des systèmes tiers (Azuriom, etc.).

### Story 4.1 : Endpoint de polling votes pour le plugin

En tant que **plugin Java ou système tiers**,
je veux interroger l'API pour savoir si un joueur a voté et connaître son total de votes,
afin de déclencher les récompenses in-game appropriées au bon moment.

**Acceptance Criteria:**

**Given** un serveur a une `api_key_hash` valide (Story 3.4) et des paliers configurés (Story 3.3)
**When** `GET /api/v1/vote/verify/:token/:pseudo` est appelé avec le token serveur et un pseudo
**Then** la réponse contient `{ has_vote: boolean, vote_at: "ISO8601"|null, next_vote_at: "ISO8601"|null, pseudo: string, total_votes: number }`
**And** `total_votes` = COUNT de tous les votes de ce pseudo pour ce serveur (toutes périodes confondues)
**And** le pseudo est validé par regex `^[a-zA-Z0-9_]{3,16}$` — HTTP 422 si invalide
**And** l'endpoint est rate-limité à 60 requêtes/minute par token serveur (NFR12)
**And** l'endpoint respecte le versioning `/api/v1/` (NFR17)

### Story 4.2 : Middleware d'authentification plugin (X-Api-Key)

En tant que **système**,
je veux un middleware `api_key_middleware` qui valide le header `X-Api-Key` des requêtes plugin,
afin que seuls les serveurs authentifiés puissent accéder aux endpoints plugin.

**Acceptance Criteria:**

**Given** un endpoint plugin est appelé
**When** le header `X-Api-Key` est présent
**Then** le middleware hash la clé reçue (Argon2) et la compare à `servers.api_key_hash`
**And** si valide → `request.server` est attaché pour les controllers suivants
**And** si invalide ou absent → HTTP 401
**And** un serveur ne peut accéder qu'aux données de son propre `server_id` — pas d'usurpation possible
**And** le middleware est réutilisable pour tout futur endpoint plugin

### Story 4.3 : Plugin Java officiel v1

En tant qu'**admin de serveur**,
je veux installer un plugin Bukkit/Spigot/Paper qui détecte automatiquement les votes et déclenche les récompenses sans polling de masse,
afin que mes joueurs reçoivent leurs récompenses sans surcharger l'API.

**Acceptance Criteria:**

**Given** l'endpoint de polling (Story 4.1) et les paliers configurés (Story 3.3) sont disponibles
**When** le plugin est installé sur un serveur Bukkit/Spigot/Paper (versions récentes + 2 dernières LTS — NFR16)
**Then** le plugin se configure via `config.yml` : `api_token`, `server_id`
**And** sur `PlayerJoinEvent` → le plugin appelle `GET /vote/verify/:token/:pseudo` pour ce seul joueur → si `has_vote = true` → exécute les commandes du palier correspondant au `total_votes`
**And** une commande `/votereward` permet au joueur de réclamer manuellement ses récompenses → même appel API à la demande
**And** aucun polling en arrière-plan sur l'ensemble des joueurs connectés
**And** avant toute exécution de commande, le pseudo est re-validé par regex `^[a-zA-Z0-9_]{3,16}$` — refus silencieux si invalide (protection injection)
**And** `{player}` dans chaque entrée du tableau `reward_commands` est remplacé par le pseudo validé
**And** le code source est publié open source sur GitHub avec une documentation incluant un exemple d'intégration Azuriom
**Note:** WebSocket push (réception d'événements en temps réel depuis le backend) est prévu en Phase 2 pour les grands réseaux souhaitant zéro polling

---

## Epic 5 : Page partenaires

Les visiteurs peuvent consulter les offres et codes affiliés des hébergeurs partenaires.

### Story 5.1 : Page partenaires avec codes affiliés

En tant que **visiteur**,
je veux consulter une page listant les hébergeurs partenaires avec leurs offres et codes de réduction,
afin de choisir un hébergeur de confiance pour mon serveur Minecraft.

**Acceptance Criteria:**

**Given** le visiteur navigue sur le site
**When** il accède à `/partners`
**Then** la page affiche les partenaires hébergeurs avec : logo, nom, description courte, code affilié et lien
**And** la page est rendue en SSR pour l'indexation SEO
**And** les codes affiliés sont gérables depuis le panel admin (ajout/modification/suppression) sans déploiement
