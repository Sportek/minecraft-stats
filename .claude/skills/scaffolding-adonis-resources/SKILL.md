---
name: scaffolding-adonis-resources
description: Scaffolds AdonisJS 7 backend resources (models, controllers, migrations, validators, policies, services, mails, factories, etc.) with the Ace CLI instead of hand-written files. Use when the user asks to create, generate or "make" a backend model, controller, migration, validator, policy, service, middleware, mail, factory, seeder, test or a full CRUD resource in backend/. Do NOT use for frontend components or for editing existing backend files.
---

# Scaffolding AdonisJS resources

Generate backend files (`backend/`, AdonisJS 7) with the **Ace CLI** instead of hand-writing them. The CLI
applies the project's stubs, naming conventions, and pluralization automatically.

## Core rule: use the CLI, don't hand-create files

When a file type has a `make:` command, generate it with `node ace make:*`. Only
write a file by hand when no command exists for it. This keeps boilerplate, imports,
and naming consistent with the project (including any ejected stubs).

When unsure of a command's exact flags, run `node ace <command> --help` — do not guess
flag names.

## Common make commands

| Command | Creates |
|---|---|
| `node ace make:model Post` | Lucid model (singular, PascalCase) |
| `node ace make:controller posts` | HTTP controller (pluralized → `PostsController`) |
| `node ace make:migration posts` | Migration file |
| `node ace make:validator post` | VineJS validator |
| `node ace make:policy server` | Bouncer policy (owner-scoped authorization) |
| `node ace make:service post` | Service class |
| `node ace make:mail verify_email` | Mail class (templates are MJML in this repo) |
| `node ace make:middleware auth` | HTTP middleware |
| `node ace make:factory Post` | Model factory (for tests/seeders) |
| `node ace make:seeder Post` | Database seeder |
| `node ace make:test posts` | Japa test file |
| `node ace make:exception` | Custom exception |
| `node ace make:event` / `make:listener` | Event / listener |

Run `node ace list` to see every available command for the installed version.

### Naming conventions the CLI follows

- **Models** are singular PascalCase: `make:model Post` → `Post`.
- **Controllers** are pluralized: `make:controller post` → `PostsController`. Pass
  `--singular` to keep the singular form.

## make:controller flags

- `-r`, `--resource` — resourceful controller with all 7 RESTful methods:
  `index`, `create`, `store`, `show`, `edit`, `update`, `destroy`.
- `-a`, `--api` — like `--resource` but without the view-rendering methods (`create`,
  `edit`); use this for JSON APIs.
- `-s`, `--singular` — singular controller name.
- `-f`, `--force` — overwrite an existing file.
- Pass action names as extra arguments to scaffold only those methods.

```bash
node ace make:controller posts --resource
node ace make:controller posts --api
node ace make:controller posts index show   # only index + show methods
```

## make:model flags (generate related files together)

`make:model` can scaffold related files in the same command:

- `-m`, `--migration` — also create the migration.
- `--controller` — also create the controller.
- `--transformer` — also create the transformer (this repo has none so far).
- `-f`, `--factory` — also create the factory.

**Always use the long form `--controller`.** In this Ace version `-c` is declared by both
`--controller` and `--transformer` (`node ace make:model --help`), so the short flag is ambiguous.

```bash
# Model + migration + controller + factory
node ace make:model Post -m --controller -f

# Just the model
node ace make:model Post
```

`--controller` scaffolds a **plain** controller (no CRUD methods). For a resourceful
controller, generate it separately so you can pass `--resource`:

```bash
node ace make:model Post -m -f
node ace make:controller posts --resource
```

## Resource workflow

Copy this checklist and check items off:

```
Resource progress:
- [ ] 1. Generated the files with Ace
- [ ] 2. Defined the migration columns and ran the migration
- [ ] 3. Defined the model columns/relationships
- [ ] 4. Added a validator for create/update payloads
- [ ] 5. Added a policy if the resource is owner-scoped
- [ ] 6. Implemented controller actions
- [ ] 7. Registered the route(s) in the rate-limited /api/v1 group
- [ ] 8. Added Swagger annotations and ran node ace docs:generate
- [ ] 9. Verified it runs
```

**1. Generate.** For a full CRUD resource:

```bash
node ace make:model Post -m -f          # model + migration + factory
node ace make:controller posts --resource
node ace make:validator post --resource
```

**2. Migration.** Edit the generated migration's `up`/`down` to define columns, then run:

```bash
node ace migration:run
```

Use `node ace migration:rollback` to undo, or `node ace migration:fresh` to rebuild.

**3. Model.** Add the `@column` properties, relationships, and any computed fields.

**4. Validator.** Generate with `node ace make:validator post --resource` to get both
create and update schemas. Define the VineJS rules, then use them in the controller
(`request.validateUsing(...)`).

**5. Policy.** For anything a user owns, `node ace make:policy <name>` and guard the mutating actions
the way existing controllers do: `if (await bouncer.with(ServerPolicy).denies('update', server))`
returns a 403.

**6. Controller.** Implement the actions. For `--api` controllers, return JSON; load and
persist data through the Lucid model.

**7. Register routes.** `make:controller` does NOT register routes — add them manually
in `start/routes.ts`. For a resourceful controller, use a resource route:

```ts
const PostsController = () => import('#controllers/posts_controller')

router.resource('posts', PostsController)        // all 7 routes
router.resource('posts', PostsController).apiOnly() // API: no create/edit routes
```

**8. Swagger.** Annotate the actions; `node ace docs:generate` must pass - an invalid
`@responseBody` breaks the Docker image build, hence the deploy.

**9. Verify.** Run the dev server (`node ace serve --watch` or the project's `dev`
script) and confirm the routes load. List routes with `node ace list:routes`.

## Customizing what the CLI generates

To change the generated boilerplate project-wide, eject the relevant stub and edit it —
the `make:` commands use the ejected templates afterward. Run `node ace eject --help` for
the stub path to copy.

## Troubleshooting

**`make:model -c` generated the wrong file / nothing**
Cause: `-c` is shared by `--controller` and `--transformer`.
Fix: delete what was generated and rerun with `--controller`.

**`migration:run` fails with a connection error**
Cause: the local PostgreSQL isn't reachable with the values in `backend/.env`.
Fix: start the DB (see `backend/README.md`), check `DB_HOST`/`DB_PORT`, rerun.

**New route returns 404**
Cause: `make:controller` never registers routes.
Fix: add it to `start/routes.ts` inside the `/api/v1` group, then `node ace list:routes`.

**`docs:generate` fails after adding a controller**
Cause: a malformed Swagger annotation (e.g. a `null` inside `@responseBody`).
Fix: correct the annotation; the build and deploy depend on this command.
