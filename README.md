# Minecraft Stats 📊

![Minecraft Stats Banner](./frontend/public/images/minecraft-stats/banner.png)

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Sportek/minecraft-stats)
[![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/dGEqqPEaXP)
[![License](https://img.shields.io/badge/License-GPL%20v3-blue.svg?style=for-the-badge)](LICENSE)

**Minecraft Stats** est une plateforme web complète permettant de suivre et d'analyser les statistiques de joueurs en temps réel pour plus de 70 serveurs Minecraft différents. Si votre serveur n'est pas listé, vous pouvez l'ajouter instantanément et commencer à collecter des données historiques !

🌐 **Site web** : [minecraft-stats.fr](https://minecraft-stats.fr)

---

## 🎯 Pourquoi utiliser Minecraft Stats ?

- ✅ **Conservation des données** : Nous sauvegardons toutes les données historiques, sans limitation de temps
- ⚡ **Ajout instantané** : Ajoutez votre serveur en quelques secondes
- 📈 **Analyses détaillées** : Visualisez la croissance de votre serveur avec des graphiques interactifs
- 🔍 **Recherche avancée** : Filtrez par catégories, langues et nom de serveur
- 🌍 **Multi-langues** : Support des serveurs français, anglais, internationaux et plus
- 📊 **Statistiques globales** : Consultez les tendances de l'ensemble de la communauté Minecraft
- 🎨 **Interface moderne** : Design responsive avec mode sombre/clair
- 🔐 **Authentification sécurisée** : Connexion via email, Google ou Discord

---

## ✨ Fonctionnalités principales

### 📊 Suivi des statistiques

- **Collecte automatique** : Ping de tous les serveurs toutes les 10 minutes
- **Métriques en temps réel** :
  - Nombre de joueurs connectés
  - Capacité maximale du serveur
  - Statut en ligne/hors ligne
  - Version Minecraft
  - Favicon du serveur
- **Historique complet** : Visualisation des données sur différentes périodes (30 min, 1h, 6h, 1 jour, 1 semaine)
- **Agrégation intelligente** : Les données sont regroupées automatiquement selon l'intervalle de temps sélectionné

### 📈 Analyses et croissance

- **Métriques de croissance** :
  - Croissance hebdomadaire (comparaison semaine actuelle vs semaine précédente)
  - Croissance mensuelle (comparaison sur 4 semaines)
  - Moyennes de joueurs sur différentes périodes
- **Classement des serveurs** : Tri par nombre de joueurs actifs
- **Mini-graphiques** : Visualisation rapide des tendances sur 24h dans les cartes de serveur
- **Graphiques détaillés** : Visualisation complète avec AG Charts sur la page de chaque serveur

### 🏷️ Catégorisation et recherche

- **Catégories de serveurs** :
  - Survival
  - Creative
  - PvP
  - Roleplay
  - Moddé
  - Mini-jeux
  - Et bien plus...
- **Filtrage par langue** : FR, EN, ES, DE, etc.
- **Recherche textuelle** : Recherche par nom ou adresse IP
- **Filtres multiples** : Combinez catégories, langues et recherche

### 👤 Gestion de compte

- **Authentification multiple** :
  - Inscription/Connexion par email avec vérification
  - OAuth Google
  - OAuth Discord
- **Gestion des serveurs** :
  - Ajout de serveurs avec validation en temps réel
  - Modification des informations du serveur
  - Suppression de serveurs
  - Association de catégories et langues
- **Sécurité** :
  - Mots de passe hashés avec Argon2
  - Tokens d'accès sécurisés
  - Vérification d'email obligatoire
  - Rate limiting sur toutes les routes

### 🎨 Interface utilisateur

- **Design moderne** :
  - Interface responsive pour mobile, tablette et desktop
  - Mode sombre/clair avec transition fluide
  - Composants UI basés sur Radix UI (shadcn/ui)
  - Animations avec Framer Motion
- **Performance optimisée** :
  - Chargement lazy des composants
  - Images optimisées (WebP, responsive)
  - Mise en cache intelligente avec SWR
  - Préchargement des données critiques
- **Accessibilité** :
  - Navigation au clavier
  - Lecteurs d'écran supportés
  - Contraste de couleurs optimisé

### 🔗 API publique

API REST complète avec documentation Swagger interactive disponible sur `/docs`.

**Endpoints principaux** :

#### Serveurs

- `GET /api/v1/servers` - Liste tous les serveurs avec leurs stats récentes
- `GET /api/v1/servers/paginate` - Pagination avec filtres (catégories, langues, recherche)
- `GET /api/v1/servers/:id` - Détails d'un serveur spécifique
- `POST /api/v1/servers` - Ajouter un nouveau serveur (authentification requise)
- `PUT /api/v1/servers/:id` - Modifier un serveur (propriétaire uniquement)
- `DELETE /api/v1/servers/:id` - Supprimer un serveur (propriétaire uniquement)

#### Statistiques

- `GET /api/v1/servers/:server_id/stats` - Statistiques d'un serveur
  - Paramètres : `fromDate`, `toDate`, `interval` (30 minutes, 1 hour, 6 hours, 1 day, 1 week)
- `GET /api/v1/global-stats` - Statistiques globales de tous les serveurs
  - Agrégation des joueurs sur tous les serveurs

#### Catégories et langues

- `GET /api/v1/categories` - Liste des catégories disponibles
- `POST /api/v1/categories` - Créer une catégorie (admin)
- `GET /api/v1/languages` - Liste des langues supportées
- `GET /api/v1/servers/:server_id/categories` - Catégories d'un serveur
- `POST /api/v1/servers/:server_id/categories` - Associer des catégories

#### Authentification

- `POST /api/v1/register` - Inscription
- `POST /api/v1/login` - Connexion
- `POST /api/v1/verify-email` - Vérification d'email
- `GET /api/v1/me` - Informations de l'utilisateur connecté
- `POST /api/v1/change-password` - Changement de mot de passe
- `GET /api/v1/login/:provider` - OAuth (Google, Discord)
- `GET /api/v1/callback/:provider` - Callback OAuth

#### Statistiques de la plateforme

- `GET /api/v1/website-stats` - Statistiques globales du site
- `GET /metrics` - Métriques Prometheus pour monitoring

**Sécurité de l'API** :

- Rate limiting adaptatif sur toutes les routes
- Authentification par Bearer token
- Validation des données avec VineJS
- Protection CORS configurée
- Headers de sécurité HTTP

---

## 🏗️ Architecture technique

### Stack technologique

#### Backend

- **Framework** : AdonisJS 6 (TypeScript)
- **Base de données** : PostgreSQL
- **ORM** : Lucid
- **Authentification** : @adonisjs/auth avec tokens d'accès
- **Validation** : VineJS
- **Autorisation** : Bouncer (policies)
- **Emails** : MJML + @adonisjs/mail
- **Tâches planifiées** : adonisjs-scheduler
- **Rate limiting** : @adonisjs/limiter avec Redis
- **Documentation** : Auto-Swagger (Swagger/OpenAPI)
- **Monitoring** : Prometheus avec @julr/adonisjs-prometheus
- **Ping Minecraft** : @minescope/mineping
- **Traitement d'images** : Sharp (conversion WebP)

#### Frontend

- **Framework** : Next.js 15 (App Router)
- **React** : Version 19
- **Build** : Turbopack (dev), SWC (production)
- **Styling** : Tailwind CSS
- **Composants UI** : Radix UI (shadcn/ui)
- **Graphiques** : AG Charts Community
- **Animations** : Framer Motion
- **Gestion d'état** : React Context + SWR
- **Formulaires** : React Hook Form + Zod
- **Thème** : next-themes

### Architecture de la base de données

**Tables principales** :

- `servers` - Informations des serveurs Minecraft
- `server_stats` - Statistiques collectées toutes les 10 minutes (time-series)
- `server_growth_stats` - Métriques de croissance calculées
- `categories` - Catégories de serveurs
- `server_categories` - Relation many-to-many serveurs ↔ catégories
- `languages` - Langues supportées
- `server_languages` - Relation many-to-many serveurs ↔ langues
- `users` - Comptes utilisateurs
- `access_tokens` - Tokens de session

### Système de collecte des données

**Scheduler** (tâches automatisées) :

1. **Toutes les 10 minutes** :

   - Ping de tous les serveurs Minecraft
   - Espacement uniforme des requêtes pour éviter les surcharges
   - Mise à jour des informations (joueurs, version, MOTD)
   - Enregistrement des statistiques dans `server_stats`
   - Limitation à 1 requête simultanée avec délai calculé

2. **Toutes les 6 heures** :
   - Rafraîchissement des favicons des serveurs
   - Calcul des métriques de croissance (hebdomadaire/mensuelle)
   - Conversion des images en format WebP pour optimisation

### Performance et optimisation

- **Requêtes SQL optimisées** : Utilisation de l'agrégation PostgreSQL native
- **Indexes** : Sur `server_id`, `created_at` pour les requêtes time-series
- **Caching** :
  - SWR côté frontend avec revalidation automatique
  - Redis pour le rate limiting
- **Images optimisées** :
  - Conversion automatique en WebP
  - Tailles responsive (48px à 1200px)
  - Lazy loading
  - Cache TTL de 31 jours
- **Code splitting** : Composants chargés dynamiquement avec Next.js
- **Suppression des console.log** en production

---

## 🚀 Installation et déploiement

### Prérequis

- Node.js 20+ et Yarn 1.22+
- PostgreSQL 14+
- Redis (pour le rate limiting)

### Installation locale

#### 1. Cloner le repository

```bash
git clone https://github.com/Sportek/minecraft-stats.git
cd minecraft-stats/code
```

#### 2. Backend

```bash
cd backend

# Installer les dépendances
yarn install

# Configurer les variables d'environnement
cp .env.example .env.development
# Éditer .env.development avec vos configurations

# Démarrer PostgreSQL avec Docker (optionnel)
docker compose --env-file ./.env.development up -d

# Exécuter les migrations
node ace migration:run

# Démarrer le serveur de développement
yarn dev
```

Le backend sera accessible sur `http://localhost:9000`.

#### 3. Frontend

```bash
cd frontend

# Installer les dépendances
yarn install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec l'URL de votre backend

# Démarrer le serveur de développement
yarn dev
```

Le frontend sera accessible sur `http://localhost:3000`.

### Variables d'environnement

#### Backend (.env.development)

```env
# Application
PORT=9000
HOST=0.0.0.0
NODE_ENV=development
APP_KEY=votre_clé_secrète_32_caractères

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_DATABASE=minecraft_stats

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Mail (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your_email@example.com
SMTP_PASSWORD=your_password

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

#### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:9000/api/v1
```

### Déploiement en production

#### Docker (recommandé)

```bash
# Backend
cd backend
yarn build:docker
yarn start:docker

# Frontend (déployer sur Vercel, Netlify, ou autre)
cd frontend
yarn build
yarn start
```

#### Manuel

```bash
# Backend
cd backend
yarn build
yarn start

# Frontend
cd frontend
yarn build
yarn start
```

---

## 🧪 Tests

### Backend

```bash
cd backend

# Exécuter tous les tests
yarn test

# Tests unitaires uniquement
node ace test --suite=unit

# Tests fonctionnels uniquement
node ace test --suite=functional
```

### Linting et formatage

```bash
# Backend
cd backend
yarn lint          # Vérifier le code
yarn lint:fix      # Corriger automatiquement
yarn format        # Formatter avec Prettier
yarn typecheck     # Vérification TypeScript

# Frontend
cd frontend
yarn lint
```

---

## 📖 Documentation

- **API Documentation** : Disponible sur `/docs` (Swagger UI interactif)
- **API Spec** : JSON disponible sur `/swagger`
- **CLAUDE.md** : Guide pour les développeurs et l'IA

---

## 🎯 Roadmap et objectifs futurs

- [x] Documentation API améliorée avec Swagger
- [x] Sécurité API (Rate limiting)
- [x] Filtrage par langue (FR / EN / INTER / TOUS)
- [ ] Système de clés API synchronisées aux comptes
- [ ] Traductions françaises complètes de l'interface
- [ ] Support des serveurs Bedrock Edition
- [ ] Notifications Discord/Email pour alertes de serveurs
- [ ] Comparaison de serveurs côte à côte
- [ ] Export des données (CSV, JSON)

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment participer :

1. **Fork** le projet
2. **Créer une branche** pour votre fonctionnalité (`git checkout -b feature/MaSuperFonctionnalite`)
3. **Commit** vos changements (`git commit -m 'Ajout d\'une super fonctionnalité'`)
4. **Push** vers la branche (`git push origin feature/MaSuperFonctionnalite`)
5. **Ouvrir une Pull Request**

### Guidelines

- Suivre les conventions de code (ESLint + Prettier)
- Ajouter des tests pour les nouvelles fonctionnalités
- Mettre à jour la documentation si nécessaire
- Décrire clairement les changements dans la PR

---

## 📝 Licence

Ce projet est sous licence **GPL-3.0**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👨‍💻 Auteur

**Sportek** (Gabriel Landry)

- GitHub: [@Sportek](https://github.com/Sportek)
- Discord: [Rejoindre le serveur](https://discord.gg/dGEqqPEaXP)
- Site web: [minecraft-stats.fr](https://minecraft-stats.fr)

---

## 🙏 Remerciements

- Communauté AdonisJS pour leur framework excellent
- Vercel/Next.js pour le framework frontend
- Tous les contributeurs et utilisateurs de la plateforme
- Les serveurs Minecraft qui font vivre la communauté

---

## 📞 Support et contact

- **Issues** : [GitHub Issues](https://github.com/Sportek/minecraft-stats/issues)
- **Discord** : [Serveur Discord](https://discord.gg/dGEqqPEaXP)
- **Email** : contact via le site web

---

## 🔄 Statut du projet

🟢 **Actif** - Le projet est maintenu activement et de nouvelles fonctionnalités sont régulièrement ajoutées.

**Dernière mise à jour** : Novembre 2024 - Mise à jour vers version 2.0.0 avec nouveau système de ping Minecraft

---

<p align="center">
  Fait avec ❤️ pour la communauté Minecraft
</p>
