# Manual migrations

This folder is **not** scanned by `node ace migration:run`. Migrations here are operations
that must be executed by an operator during a maintenance window with a backup at hand.

## When to run a manual migration

- Destructive table rewrites (e.g. partitioning a multi-million-row table)
- Operations that may take hours
- Anything that needs a pre-flight backup and dress rehearsal on a copy

## Procedure (high level)

1. **Backup** the affected table(s) : `pg_dump -t <table> > backup.sql`
2. **Test** on a copy of production (Docker, staging, or a temporary DB)
3. **Schedule** a maintenance window if user-facing impact is possible
4. **Execute** via `psql` or hand-run the migration class
5. **Verify** endpoints and dashboards before declaring done
6. **Cleanup** any `_old` shadow tables after ≥24h of stable operation

## Files

- `partition_server_stats.ts` — Story P.4.2. Converts `server_stats` to a Postgres
  RANGE-partitioned table (monthly). See file header for the full procedure.
