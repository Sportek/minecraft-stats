# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Minecraft Stats is a full-stack web application that tracks player count statistics for Minecraft servers. It consists of:
- **Backend**: AdonisJS 6 API (TypeScript) with PostgreSQL database
- **Frontend**: Next.js 15 (React 19) with TypeScript, using Turbopack

The application pings Minecraft servers every 10 minutes to collect player statistics, stores historical data, and provides a public API and web interface to visualize server growth and trends.

## Architecture

### Backend (AdonisJS)

**Framework**: AdonisJS 6 with Lucid ORM, running on Node.js

**Key Components**:
- **Models** (`app/models/`):
  - `Server` - Minecraft server information with relationships to categories, languages, stats, and users
  - `ServerStat` - Time-series data for player counts (collected every 10 minutes)
  - `ServerGrowthStat` - Calculated weekly/monthly growth metrics
  - `Category` - Server categorization (e.g., Survival, Creative, PvP)
  - `Language` - Server language tags (FR, EN, etc.)
  - `User` - Authentication and server ownership

- **Controllers** (`app/controllers/`):
  - `ServersController` - CRUD operations and pagination for servers
  - `StatsController` - Retrieves stats with interval aggregation (30 min, 1 hour, 6 hours, etc.)
  - `CategoriesController` - Category management
  - `AuthController` - Login, register, OAuth (Google/Discord), email verification
  - `WebsiteStatsController` - Global platform statistics

- **Services** (`app/services/`):
  - `StatsService` - Statistical calculations, interval aggregation, growth metrics computation

- **Policies** (`app/policies/`): Authorization using Bouncer (user can only modify their own servers)

- **Minecraft Ping** (`minecraft-ping/minecraft_ping.ts`): Uses `@minescope/mineping` to query Java Minecraft servers for status, player count, version, MOTD, and favicon

- **Scheduled Tasks** (`start/scheduler.ts`):
  - Every 10 minutes: Ping all servers with uniform spacing to avoid rate limits
  - Every 6 hours: Refresh server favicons and calculate growth statistics

**Database**: PostgreSQL with migrations in `database/migrations/`

**API Routes** (`start/routes.ts`): All endpoints under `/api/v1` with rate limiting via `@adonisjs/limiter`

**Import Aliases**: Uses `#` prefix (e.g., `#models/server`, `#controllers/auth_controller`)

### Frontend (Next.js)

**Framework**: Next.js 15 with App Router, React 19, and Turbopack for dev mode

**Key Directories**:
- `src/app/` - Next.js App Router pages and layouts
  - `(pages)/` - Main application pages
  - `(auth)/` - Login, sign-up, OAuth callbacks
  - `account/` - User account settings, server management

- `src/components/` - React components organized by feature:
  - `serveur/` - Server cards, stats visualization
  - `form/` - Login, sign-up, password change forms
  - `ui/` - Radix UI components (shadcn/ui style)
  - `dark-mode/` - Theme provider and toggle
  - `metrics/` - Google Analytics, Microsoft Clarity

- `src/contexts/` - React Context providers:
  - `auth.tsx` - User authentication state
  - `servers.tsx` - Server data management with SWR
  - `favorite.tsx` - Favorite servers (localStorage)

- `src/http/` - API client functions:
  - `auth.ts` - Authentication endpoints
  - `server.ts` - Server CRUD and stats fetching

- `src/types/` - TypeScript type definitions

**Styling**: Tailwind CSS with custom configuration, shadcn/ui components

**Data Fetching**: SWR for server-side rendering and client-side caching

**Charts**: AG Charts for visualizing player statistics

## Development Commands

### Backend (run from `backend/` directory)

```bash
# Install dependencies
yarn install

# Development server with hot module reload
yarn dev

# Build for production
yarn build

# Start production server
yarn start

# Database migrations
node ace migration:run
node ace migration:rollback

# Run tests
yarn test

# Linting and formatting
yarn lint
yarn lint:fix
yarn format

# Type checking
yarn typecheck

# Generate Swagger documentation
node ace docs:generate

# Run scheduler (for background tasks)
node ace scheduler:run

# Docker commands
yarn build:docker
yarn run:docker
yarn start:docker
yarn stop:docker
```

### Frontend (run from `frontend/` directory)

```bash
# Install dependencies
yarn install

# Development server with Turbopack
yarn dev

# Build for production
yarn build

# Start production server
yarn start

# Linting
yarn lint
```

### Database Setup

The backend requires PostgreSQL. For local development, use Docker Compose as described in `backend/README.md`:

```bash
# From project root, create docker-compose.override.yml for local dev
docker compose --env-file ./.env.development up -d
```

After starting PostgreSQL, run migrations from `backend/`:
```bash
node ace migration:run
```

## Key Architectural Patterns

### Stats Aggregation System

The `StatsService` provides flexible time-series querying:
- **Raw stats**: All data points (collected every 10 minutes)
- **Interval aggregation**: Groups stats by intervals (30 min, 1 hour, 2 hours, 6 hours, 1 day, 1 week) using PostgreSQL `floor(extract(epoch...))` for efficient bucketing
- **Exact time lookup**: If data doesn't exist at exact timestamp, averages between nearest before/after data points
- **Growth calculations**: Weekly/monthly growth percentages stored in `ServerGrowthStat`

Stats queries accept `fromDate`, `toDate` (epoch milliseconds), and `interval` parameters.

### Scheduler Uniform Spacing

To avoid overwhelming servers or network, the scheduler spaces out pings uniformly across 10-minute windows using `pLimit(1)` and calculated delays between each server.

### Language Sync Pattern

The `Server.syncLanguages()` method handles many-to-many language relationships with manual transaction control to ensure atomic updates when adding/removing language tags.

### Authentication Flow

- **Session-based**: Uses AdonisJS Auth with access tokens stored in database
- **OAuth**: Google and Discord via Ally provider
- **Email verification**: JWT-based email verification flow with mail templates (MJML)
- **Password hashing**: Argon2 via `@adonisjs/hash`

### Frontend State Management

- **SWR** for server data with automatic revalidation
- **React Context** for auth state and favorites
- **localStorage** for client-side persistence (favorites, theme)

## API Documentation

Swagger/OpenAPI docs are auto-generated via `adonis-autoswagger`:
- View docs at `/docs` (Scalar UI)
- JSON spec at `/swagger`

## Testing

Backend uses Japa test runner:
- Unit tests: `tests/unit/**/*.spec.ts`
- Functional tests: `tests/functional/**/*.spec.ts`

Run with: `node ace test` or `yarn test`

## Image Handling

Server favicons are:
1. Fetched from Minecraft server ping response (base64)
2. Saved as PNG to `backend/public/images/servers/{server_id}.png`
3. Converted to WebP using Sharp for optimal web delivery
4. Served via static file middleware

## Environment Variables

Backend requires (see `backend/config/` for usage):
- Database: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`
- App: `PORT`, `HOST`, `NODE_ENV`, `APP_KEY`
- Mail: SMTP configuration
- OAuth: Google/Discord client IDs and secrets
- Redis: For rate limiting

Frontend requires:
- `NEXT_PUBLIC_API_URL` - Backend API base URL

## Common Development Workflows

### Adding a new server endpoint

1. Define route in `backend/start/routes.ts` with rate limiting
2. Create/update controller in `backend/app/controllers/`
3. Add validation in `backend/app/validators/` using VineJS
4. Apply authorization via policies in `backend/app/policies/`
5. Update Swagger annotations for auto-documentation
6. Add frontend HTTP client function in `frontend/src/http/`

### Adding a new migration

```bash
cd backend
node ace make:migration create_table_name
# Edit migration file in database/migrations/
node ace migration:run
```

### Modifying stats calculation logic

Stats logic is centralized in `backend/app/services/stat_service.ts`. The service handles all aggregation, interpolation, and growth calculations. Update methods there and ensure scheduler in `start/scheduler.ts` calls the updated logic.

## Performance Considerations

- Rate limiting configured per-route in `start/limiter.ts`
- Stats queries use PostgreSQL native aggregation for efficiency
- Frontend images lazy-loaded with progressive loading component
- Next.js optimizes images automatically (WebP, responsive sizes)
- Console logs removed in production builds (`removeConsole: true`)
- SWR caching reduces redundant API calls

## Package Management

Both frontend and backend use Yarn 1.22.22 as specified in `packageManager` field.
