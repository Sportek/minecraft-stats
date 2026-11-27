# Frontend — Minecraft Stats

Next.js 16 (App Router, Turbopack), React 19 avec le React Compiler, Tailwind et
shadcn/ui, SWR pour les données, AG Charts pour les courbes, next-intl pour le FR/EN.

```bash
yarn install
cp .env.example .env.local
yarn dev          # http://localhost:3000
```

`.env.example` pointe sur le backend local (`localhost:9000`). Pour travailler sans
backend, il contient aussi un bloc qui utilise l'API publique.

Scripts : `yarn dev`, `yarn build`, `yarn start`, `yarn lint`, `yarn test`.

Pour le parcours complet (backend, données de démo, conventions de PR), voir
[CONTRIBUTING.md](../CONTRIBUTING.md). L'architecture du frontend (ISR, i18n,
appels SSR vers l'API) est décrite dans [CLAUDE.md](../CLAUDE.md) et
[docs/i18n.md](../docs/i18n.md).
