---
stepsCompleted: [step-01-init, step-02-context, step-03-starter, step-04-decisions, step-05-patterns, step-06-structure, step-07-validation, step-08-complete]
status: complete
completedAt: '2026-04-12'
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/implementation-readiness-report-2026-04-12.md"
  - "_bmad-output/minecraft-stats-overview.md"
  - "codebase: C:/Users/Gabriel/Desktop/Minecraft-Stats/code (analysé)"
workflowType: 'architecture'
project_name: 'Minecraft Stats'
user_name: 'Gabriel'
date: '2026-04-12'
---

# Architecture Decision Document

_Ce document se construit collaborativement étape par étape. Les sections sont ajoutées au fil de chaque décision architecturale._

## Analyse du contexte projet

### Vue d'ensemble des exigences

**Exigences fonctionnelles (36 FR) :**

| Domaine | FRs | Statut codebase | Complexité |
|---|---|---|---|
| Découverte & Navigation | FR1–FR5 | Partiel (liste + recherche existants) | Faible |
| Système de vote | FR6–FR11 | Greenfield complet | Haute |
| Gestion des serveurs | FR12–FR18 | Partiel (soumission existante, dashboard manquant) | Moyenne |
| Plugin & Intégration API | FR19–FR25 | Greenfield complet | Haute |
| Authentification & Comptes | FR26–FR28 | Existant — conserver | Nulle |
| Contenu & SEO | FR29–FR31 | Existant — conserver | Nulle |
| Administration | FR32–FR35 | Majoritairement existant | Faible |
| Partenaires & Monétisation | FR36 | À créer | Faible |

**Exigences non-fonctionnelles structurantes :**

- **Performance** : LCP < 2s, API consultation < 500ms, endpoint vote < 300ms (NFR1–NFR3)
- **Cache** : Classements mis en cache Redis, invalidation partielle au reset mensuel (NFR4)
- **Sécurité** : Clés API hachées, rate limiting vote + inscription, HTTPS (NFR5–NFR7)
- **RGPD** : Suppression auto IPs après expiration cooldown (max 7 jours) — via cron scheduler existant (NFR8)
- **Scalabilité** : Pic de charge x5 au reset mensuel le 1er du mois (NFR10), index DB sur triplet vote (NFR11)
- **Fiabilité** : Cron reset idempotent, données historiques jamais supprimées (NFR14–NFR15)
- **Intégration** : Plugin compatible Bukkit/Spigot/Paper, API REST versionnée `/api/v1/` (NFR16–NFR17)

**Contraintes infrastructure :**

- VPS Pulseheberg France : 16GB RAM, 4 vCPU, partagé avec d'autres services — empreinte mémoire à minimiser
- Les deux domaines (minecraft-stats.fr et minecraft-stats.com) doivent rester opérationnels — même application, routage DNS uniquement
- Stack existante : AdonisJS + PostgreSQL + Redis + Next.js 16 + React 19
- Scheduler AdonisJS déjà opérationnel (pings 10min, recalcul growth 6h)

### Complexité & échelle

- **Domaine principal** : Full-stack web (SSR + API REST + tâches planifiées)
- **Niveau de complexité** : Moyen-haut (brownfield, ajout de systèmes entiers sur base existante)
- **Composants architecturaux à créer** : ~8
- **Trafic actuel** : ~28k visiteurs/mois → cible 50k à 3 mois post-MVP

### Contraintes techniques & dépendances connues

- PostgreSQL existant avec 10+ tables : les nouvelles tables de vote s'intègrent à ce schéma
- Redis déjà utilisé pour session/cache : réutiliser pour le cache classement et le rate limiting vote
- Scheduler AdonisJS : étendre pour le cron de reset mensuel et la purge RGPD des IPs
- Le ping serveur existant (@minescope/mineping) : réutiliser pour la validation Badge Vérifié (cross-check count plugin vs ping)
- **Migration AdonisJS v6 → v7** : à intégrer dans la feuille de route technique avant ou pendant le MVP — changements potentiels sur l'ORM Lucid, le router, les middlewares et le scheduler ; à évaluer pour éviter une double migration
- API Bearer token 30 jours : réutiliser pour les clés API serveur (scope différent, hashées en DB)
- CORS déjà configuré : vérifier que les deux domaines (.fr et .com) sont bien dans la liste des origines autorisées

### Préoccupations transversales identifiées

1. **Anti-abus vote** : Rate limiting + cooldown `(IP, pseudo, server_id)` — touche toutes les couches (DB, cache, API)
2. **RGPD — Rétention IP** : Purge automatique des IPs de vote après expiration — scheduler + index DB sur expiry
3. **Cache stratégie classement** : Reset mensuel = invalidation partielle Redis + cron idempotent = protection pic x5
4. **Protocole plugin** : WebSocket vs HTTP polling — décision critique impactant mémoire VPS et complexité Java
5. **Badge Vérifié — anti-fraude** : Cross-référence ping existant vs count plugin — seuil à définir, logique dans scheduler
6. **Vérification DNS TXT** : Polling backend sur domaine serveur — nouveau service à créer
7. **Multi-domaine** : .fr et .com → même app, CORS et callbacks OAuth à vérifier pour les deux origines
8. **Reset mensuel** : Cron 1er du mois minuit — idempotence critique, cache Redis, pic de trafic à absorber
9. **Migration AdonisJS v6 → v7** : risque de régression sur les features existantes — à planifier comme étape technique dédiée

## Fondation technique

### Contexte brownfield — stack en production

Ce projet étend une application existante. Aucun starter template n'est nécessaire.
La stack technique est définie et contrainte par l'existant.

| Couche | Technologie | Version |
|---|---|---|
| Frontend | Next.js + React | 16.1.1 / 19.2.3 |
| Styling | Tailwind CSS | 3.4.1 |
| Charts | AG Charts Community | 11.2.4 |
| Forms | React Hook Form + Zod | 7.x / 4.x |
| Backend | AdonisJS | v6 → **migration v7** (voir décision ci-dessous) |
| ORM | Lucid (AdonisJS) | 21.x |
| Base de données | PostgreSQL | — |
| Cache / Session | Redis | — |
| Auth OAuth | Ally (AdonisJS) | 5.x |
| Email | Resend + MJML | — |
| Traitement image | Sharp | 0.34.x |
| Ping Minecraft | @minescope/mineping | 2.x |
| Monitoring | Prometheus | — |
| Package manager | Yarn | 1.22 |

### Décision technique — Migration AdonisJS v6 → v7

**Décision : Option A — Migrer vers v7 avant d'implémenter les nouvelles features**

**Justification :**
- Implémenter le vote system, le plugin et le dashboard owner directement sur v7 évite une double migration (d'abord sur v6, puis re-migrer un codebase plus complexe)
- Le codebase est propre et bien structuré — c'est le moment optimal pour migrer
- Aucune dette technique dès le départ des nouvelles features

**Impact à vérifier lors de la migration :**
- Compatibilité : Ally v5, Lucid v21, adonisjs-scheduler, @adonisjs/limiter, adonis-autoswagger, @julr/adonisjs-prometheus
- Changements potentiels : router, middlewares, ORM Lucid, kernel

**Première story d'implémentation : Sprint 0 — Migration AdonisJS v6 → v7**

## Décisions architecturales

### Décisions critiques (bloquent l'implémentation)

| # | Décision | Choix retenu |
|---|---|---|
| 1 | Protocole plugin | HTTP polling (vote events) — WebSocket optionnel pour grands réseaux |
| 2 | Stockage cooldown | Redis (primary, TTL natif) + PostgreSQL (source de vérité, fallback) |
| 3 | Paliers de récompenses | Table dédiée `server_reward_tiers` |
| 4 | Badge Vérifié | Hors scope MVP — reporté Phase 3 |
| 5 | Vérification DNS TXT | À la demande via UI (vérification immédiate) |

### Architecture du plugin

Le plugin Bukkit/Spigot/Paper est un **mécanisme de livraison de récompenses in-game**, pas un outil de vérification du player count.

**Flux :**
- Le plugin interroge l'API périodiquement (polling HTTP) pour détecter les nouveaux votes
- Sur détection d'un vote : exécution des commandes de récompense configurées par l'owner
- Optionnel : connexion WebSocket pour les grands réseaux souhaitant des événements temps réel

**Ce qui est supprimé du scope MVP :**
- FR19 — Push player count via API (heartbeat) → inutile sans badge vérifiable
- FR20 — Badge "Vérifié" → le ping Minecraft natif est déjà utilisé (scheduler 10min), le plugin ne peut pas garantir la fiabilité des données qu'il envoie
- FR21 — Alerte divergence count plugin vs ping → supprimée avec FR19/FR20

**FRs plugin conservés :**
- FR23 — Événements de vote interceptables pour récompenses in-game
- FR24 — API HTTP polling `GET /api/v1/vote/verify/{token}/{pseudo}`
- FR25 — Deux modes documentés : HTTP polling (recommandé) + WebSocket (avancé)

**Justification :** Le player count affiché continue de venir du ping serveur existant (toutes les 10 min). N'importe quel plugin pourrait envoyer un chiffre arbitraire — le badge n'aurait aucune valeur réelle. La vraie valeur du plugin est la livraison automatique des récompenses in-game après un vote.

### Stockage du cooldown de vote

- **Redis** : clé `cooldown:{ip}:{pseudo}:{server_id}` avec TTL = durée cooldown configurée par l'owner
- **PostgreSQL** : colonne `expires_at` dans la table `votes` — source de vérité persistante
- **Fallback** : si Redis miss (crash/redémarrage) → requête PostgreSQL `WHERE expires_at > NOW()`
- **RGPD** : TTL Redis gère la purge automatique + cron PostgreSQL nettoie les lignes expirées (champ `ip` uniquement)

### Vérification DNS TXT (revendication serveur)

- L'owner génère un token depuis l'UI → ajoute `minecraft-stats-verify=<token>` sur son domaine
- Il clique "Vérifier" → le backend fait un lookup DNS en temps réel → succès ou message d'erreur immédiat
- Pas de polling planifié — vérification uniquement à la demande

### Paliers de récompenses

Table dédiée `server_reward_tiers` :
- Queryable et maintenable à long terme
- Flexible pour l'évolution Phase 2 (streak, parrainage)
- Plus facile à valider côté backend (contraintes DB)

## Patterns d'implémentation & règles de cohérence

### Conventions de nommage

**Base de données — snake_case partout**
```
Tables    : snake_case pluriel → votes, server_reward_tiers
Colonnes  : snake_case        → server_id, expires_at, player_count
FK        : {table_singulier}_id → server_id, user_id
Index     : idx_{table}_{colonnes} → idx_votes_ip_pseudo_server_id
```

**API REST — plural, versionnée `/api/v1/`**
```
GET    /api/v1/servers/:id/votes
POST   /api/v1/servers/:id/vote
GET    /api/v1/vote/verify/:token/:pseudo
POST   /api/v1/plugin/heartbeat
PATCH  /api/v1/servers/:id/claim
```

**Code backend (AdonisJS)**
```
Controllers : thin — délèguent à validators + services
Services    : logique métier → VoteService, ClaimService
Validators  : VineJS pour toutes les entrées
Policies    : Bouncer pour l'autorisation
Modèles     : Lucid avec relations définies
```

**Code frontend (Next.js)**
```
Composants  : PascalCase (VoteButton.tsx, ServerCard.tsx)
Fichiers    : kebab-case dans /http/ (vote.ts, servers.ts)
State       : Context API global, useState local
Fetch       : SWR pour lecture, fetch() pour mutations
Types       : /types/ partagés
```

### Format des réponses API

```json
// Succès liste : tableau direct
[{ "id": 1, "name": "..." }]

// Succès objet : objet direct
{ "id": 1, "name": "..." }

// Erreur validation (AdonisJS standard)
{ "errors": [{ "message": "...", "field": "..." }] }

// Erreur métier vote (codes standardisés)
{ "error": "COOLDOWN_ACTIVE", "remaining_seconds": 3600, "next_vote_at": "2026-04-12T..." }
{ "error": "DNS_VERIFICATION_FAILED", "expected_record": "minecraft-stats-verify=abc123" }
```

**Codes d'erreur métier**

| Code | HTTP | Contexte |
|---|---|---|
| `COOLDOWN_ACTIVE` | 429 | Vote trop tôt |
| `INVALID_PSEUDO` | 422 | Pseudo invalide |
| `SERVER_NOT_FOUND` | 404 | Serveur inexistant |
| `ALREADY_OWNER` | 409 | Serveur déjà revendiqué |
| `DNS_VERIFICATION_FAILED` | 422 | Record TXT absent ou incorrect |

### Conventions Redis

```
cooldown:{ip}:{pseudo}:{server_id}    TTL = cooldown configuré (en secondes)
ranking:monthly                        TTL = invalidation manuelle au reset
ranking:annual                         TTL = invalidation manuelle
ranking:all_time                       TTL = invalidation manuelle
```

### Auth plugin

- Header dédié : `X-Api-Key: {server_api_key}`
- Distinct du Bearer token utilisateur
- Clé hashée en DB (même pattern que `auth_access_tokens`)
- Scopée à un `server_id` — un serveur ne peut pas agir pour un autre

### Dates & timestamps

```
API JSON    : ISO 8601 → "2026-04-12T00:00:00.000Z"
PostgreSQL  : timestamp with time zone (Luxon déjà en place)
Redis TTL   : entier en secondes
```

### Règles obligatoires — tous les agents DOIVENT

- Toute nouvelle table : migration AdonisJS horodatée + cascade sur FK server_id/user_id
- Tout endpoint public : rate limiting défini dans `start/limiter.ts`
- Tout endpoint plugin : validation `X-Api-Key` via middleware dédié
- Toute donnée IP : stockée uniquement dans `votes.ip`, jamais logguée, TTL respecté
- Tout classement : passer par le cache Redis, jamais de query directe en production
- Tout pseudo : validé par regex `^[a-zA-Z0-9_]{3,16}$` avant insertion — jamais interpolé dans une commande sans validation préalable

## Structure du projet & frontières

### Backend — nouveaux fichiers

```
backend/
├── app/
│   ├── controllers/
│   │   ├── vote_controller.ts          ← NOUVEAU (FR6–FR11)
│   │   ├── claim_controller.ts         ← NOUVEAU (FR13)
│   │   ├── plugin_controller.ts        ← NOUVEAU (FR23–FR25)
│   │   └── reward_tiers_controller.ts  ← NOUVEAU (FR14–FR15)
│   │
│   ├── services/
│   │   ├── vote_service.ts             ← NOUVEAU (cooldown, ranking, Redis)
│   │   ├── claim_service.ts            ← NOUVEAU (DNS TXT lookup)
│   │   ├── ranking_service.ts          ← NOUVEAU (cache Redis classements)
│   │   └── stats_service.ts            ← EXISTANT
│   │
│   ├── middleware/
│   │   └── api_key_middleware.ts       ← NOUVEAU (auth plugin X-Api-Key)
│   │
│   ├── models/
│   │   ├── vote.ts                     ← NOUVEAU
│   │   ├── server_reward_tier.ts       ← NOUVEAU
│   │   └── server.ts                   ← MODIFIER (+ claim_token, claimed_at, api_key_hash)
│   │
│   └── validators/
│       ├── vote_validator.ts           ← NOUVEAU (inclut regex pseudo)
│       ├── claim_validator.ts          ← NOUVEAU
│       └── reward_tier_validator.ts    ← NOUVEAU
│
├── database/migrations/
│   ├── TIMESTAMP_create_votes_table.ts               ← NOUVEAU
│   ├── TIMESTAMP_create_server_reward_tiers_table.ts ← NOUVEAU
│   └── TIMESTAMP_add_claim_fields_to_servers.ts      ← NOUVEAU
│
└── start/
    ├── routes.ts      ← MODIFIER (+ nouvelles routes)
    ├── scheduler.ts   ← MODIFIER (+ cron reset mensuel + purge RGPD)
    └── limiter.ts     ← MODIFIER (+ rate limiting vote + plugin)
```

### Frontend — nouveaux fichiers

```
frontend/src/
├── app/(pages)/
│   ├── account/
│   │   ├── dashboard/page.tsx                    ← NOUVEAU (liste serveurs owner)
│   │   └── servers/[serverId]/
│   │       ├── page.tsx                          ← NOUVEAU (dashboard owner)
│   │       └── claim/page.tsx                    ← NOUVEAU (flux DNS TXT)
│   └── servers/[serverId]/[[...serverName]]/
│       └── page.tsx                              ← MODIFIER (+ vote + classement)
│
├── components/
│   ├── vote/
│   │   ├── VoteButton.tsx                        ← NOUVEAU
│   │   ├── VoteModal.tsx                         ← NOUVEAU (saisie pseudo)
│   │   └── VoteCooldown.tsx                      ← NOUVEAU (timer restant)
│   ├── rankings/
│   │   ├── RankingTabs.tsx                       ← NOUVEAU (Mensuel/Annuel/All Time)
│   │   └── TrendingSection.tsx                   ← NOUVEAU
│   └── dashboard/
│       ├── ClaimServerCard.tsx                   ← NOUVEAU
│       ├── ApiKeyManager.tsx                     ← NOUVEAU
│       ├── CooldownConfig.tsx                    ← NOUVEAU
│       └── RewardTiersForm.tsx                   ← NOUVEAU
│
├── http/
│   ├── vote.ts                                   ← NOUVEAU
│   ├── claim.ts                                  ← NOUVEAU
│   └── reward-tiers.ts                           ← NOUVEAU
│
└── types/
    ├── vote.ts                                   ← NOUVEAU
    └── ranking.ts                                ← NOUVEAU
```

### Schéma de base de données — nouvelles tables

```sql
-- votes (données permanentes, jamais supprimées)
votes
  id            uuid        PK
  server_id     FK → servers (cascade delete)
  pseudo        varchar(16) -- validé regex ^[a-zA-Z0-9_]{3,16}$
  ip            varchar(45) -- supprimé après expires_at via cron RGPD
  expires_at    timestamp   -- created_at + cooldown configuré du serveur
  created_at    timestamp
  INDEX idx_votes_ip_pseudo_server (ip, pseudo, server_id)
  INDEX idx_votes_server_created   (server_id, created_at)
  INDEX idx_votes_expires          (expires_at)

-- server_reward_tiers
server_reward_tiers
  id              uuid         PK
  server_id       FK → servers (cascade delete)
  votes_threshold integer
  label           varchar(100)
  reward_command  varchar(500) -- ex: "/give {player} diamond 1"
  created_at      timestamp
  -- {player} remplacé uniquement par un pseudo validé regex

-- Modifications table servers (ALTER via migration)
servers + claim_token   varchar(64)  UNIQUE nullable
servers + claimed_at    timestamp    nullable
servers + api_key_hash  varchar(128) nullable
```

### Sécurité — injection via pseudo Minecraft

Le champ `{player}` dans `reward_command` est remplacé par le pseudo du votant. Sans validation, un pseudo malveillant pourrait injecter des commandes Minecraft arbitraires.

**Mitigation à deux niveaux :**

**Niveau 1 — Backend (vote_validator.ts) :** validation stricte à l'entrée, avant toute insertion en DB.
```ts
pseudo: vine.string().regex(/^[a-zA-Z0-9_]{3,16}$/)
```
Le pseudo stocké et retourné par l'API est toujours valide.

**Niveau 2 — Plugin officiel (défense en profondeur) :** re-validation avant substitution dans la commande, même si le pseudo vient de notre API.
```java
if (!pseudo.matches("^[a-zA-Z0-9_]{3,16}$")) return; // refus silencieux
```

### Nouvelles routes API

```
POST   /api/v1/servers/:id/vote                  voter (sans compte)
GET    /api/v1/servers/:id/votes/stats           stats votes par période
GET    /api/v1/vote/verify/:token/:pseudo        polling plugin
PATCH  /api/v1/servers/:id/claim                 revendiquer (auth)
DELETE /api/v1/servers/:id/claim                 libérer
GET    /api/v1/servers/:id/reward-tiers          liste paliers (public)
POST   /api/v1/servers/:id/reward-tiers          créer palier (owner)
PUT    /api/v1/servers/:id/reward-tiers/:tid     modifier (owner)
DELETE /api/v1/servers/:id/reward-tiers/:tid     supprimer (owner)
POST   /api/v1/servers/:id/api-key               générer/régénérer clé (owner)
```

### Flux de données

```
Vote
  Joueur → POST /vote → VoteService
         → Redis : cooldown check (< 300ms)
         → PostgreSQL : INSERT vote
         → Redis : invalidation ranking si reset

Plugin polling
  Plugin → GET /vote/verify/:token/:pseudo
         → PostgreSQL : SELECT WHERE pseudo = :pseudo AND server_id = :id
                        AND created_at > NOW() - INTERVAL cooldown
         ← { has_vote, vote_at, next_vote_at }
         → Plugin substitue {player} après validation regex

Revendication
  Owner → PATCH /claim → ClaimService
        → DNS TXT lookup sur domaine du serveur
        ← succès : server.claimed_at = NOW(), server.user_id = owner
        ← échec  : { error: DNS_VERIFICATION_FAILED, expected_record }

Scheduler
  Cron 1er du mois à 00:00 : UPDATE votes SET votes_monthly = 0
                              + FLUSHKEY ranking:monthly dans Redis
  Cron quotidien            : UPDATE votes SET ip = NULL WHERE expires_at < NOW()
```

## Validation de l'architecture

### Couverture des exigences

| FR | Couvert par | Statut |
|---|---|---|
| FR1–FR2 | Existant + refonte UI | ✅ |
| FR3 | TrendingSection + trending_score dans server_growth_stats | ✅ |
| FR4 | RankingTabs + RankingService + Redis | ✅ |
| FR5 | Page serveur existante + modifications | ✅ |
| FR6–FR11 | vote_controller + VoteService + Redis + cron | ✅ |
| FR12 | Existant | ✅ |
| FR13 | claim_controller + ClaimService + DNS TXT | ✅ |
| FR14–FR16 | reward_tiers_controller + dashboard owner | ✅ |
| FR17–FR18 | Existant | ✅ |
| FR19–FR21 | Hors scope MVP — reporté Phase 3 | — |
| FR22 | ApiKeyManager + POST /api-key | ✅ |
| FR23–FR25 | plugin_controller + /vote/verify | ✅ |
| FR26–FR35 | Existant | ✅ |
| FR36 | Page partenaires | ✅ |

Tous les NFRs couverts. NFR9 (Stripe) = Phase 2 hors scope comme prévu.

### Résolution des gaps

**Gap #1 — Calcul des Tendances**

Score composite calculé dans `RankingService`, mis à jour par le scheduler toutes les 6h :
```
trending_score = (weekly_growth_% × 0.6) + (delta_votes_7j_vs_mois_précédent_% × 0.4)
```
Stocké dans `server_growth_stats` (nouvelle colonne `trending_score`). Réutilise les données existantes — pas de nouvelle table.

**Gap #2 — Ownership vérifié vs soumetteur**

Deux notions séparées dans la table `servers` :

| Champ | Signification | Nullable |
|---|---|---|
| `servers.user_id` | Qui a soumis le serveur (conservé, existant) | Non |
| `servers.claimed_by_id` | Propriétaire vérifié via DNS TXT | Oui |
| `servers.claim_token` | Token pour le record TXT | Oui |
| `servers.claimed_at` | Date de vérification | Oui |

- Avant revendication : `claimed_by_id = NULL` — pas de dashboard
- Après revendication DNS TXT : `claimed_by_id = auth.user.id` — dashboard + config débloqués
- Policy Bouncer : accès dashboard vérifie `server.claimed_by_id === auth.user.id`
- Le soumetteur original n'a aucun droit propriétaire sur le serveur

**Gap #3 — Polling plugin enrichi**

L'endpoint `/vote/verify/:token/:pseudo` retourne `total_votes` en plus :
```json
{
  "has_vote": true,
  "vote_at": "2026-04-12T10:00:00.000Z",
  "next_vote_at": "2026-04-12T22:00:00.000Z",
  "pseudo": "Sportek",
  "total_votes": 47
}
```
`total_votes` = `COUNT(*) FROM votes WHERE server_id = :id AND pseudo = :pseudo`. Permet aux serveurs de gérer des systèmes de rang basés sur la fidélité du votant.

### Checklist de complétude

- [x] Contexte projet analysé et contraintes identifiées
- [x] Migration AdonisJS v6 → v7 planifiée en Sprint 0
- [x] Décisions architecturales critiques documentées
- [x] Patterns d'implémentation définis
- [x] Structure complète backend + frontend
- [x] Schéma DB avec nouvelles tables et migrations
- [x] Sécurité injection pseudo — mitigation deux niveaux
- [x] RGPD — suppression IP via TTL Redis + cron PostgreSQL
- [x] Ownership vérifié séparé du soumetteur
- [x] Trending score défini et calculable
- [x] WebSocket plugin reporté Phase 2
- [x] FR19/20/21 (badge Vérifié) reportés Phase 3

### Statut global : PRÊT POUR L'IMPLÉMENTATION ✅

**Séquence d'implémentation recommandée :**
1. Sprint 0 — Migration AdonisJS v6 → v7
2. Sprint 1 — Système de vote (tables, endpoints, UI vote + classements)
3. Sprint 2 — Dashboard owner + revendication DNS TXT
4. Sprint 3 — Plugin polling + paliers de récompenses
5. Sprint 4 — Tendances + refonte UI complète
