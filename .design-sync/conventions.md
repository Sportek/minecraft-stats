# Minecraft Stats UI — conventions for building with this design system

This is a shadcn/ui-style React library (Radix primitives + Tailwind + CVA) for a
Minecraft server-stats app. Build screens by composing these components; style your
own layout glue with the Tailwind utilities below. Components are imported by name
(e.g. `Button`, `Card`, `DialogContent`).

## Setup & theming
- **No provider is required for basic styling.** The theme is plain CSS custom
  properties on `:root` (light) and `.dark` (dark). To render dark mode, put
  `class="dark"` on a wrapping element; otherwise you get the light theme.
- **A few components need a context wrapper:**
  - `Tooltip` → wrap in `TooltipProvider`.
  - `Toast` → render inside `ToastProvider` and include one `ToastViewport`.
  - `Form` is `react-hook-form`'s `FormProvider`; create state with `useForm()` and
    spread it: `<Form {...form}>`. `FormField` takes `control={form.control}`.
- **Compound components** are composed from named parts, not configured by props:
  `Card`/`CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter`;
  `Dialog`/`DialogTrigger`/`DialogContent`/`DialogHeader`/`DialogTitle`/`DialogFooter`;
  `Select`/`SelectTrigger`/`SelectValue`/`SelectContent`/`SelectItem`;
  `DropdownMenu`/`DropdownMenuTrigger`/`DropdownMenuContent`/`DropdownMenuItem`;
  `Popover`/`PopoverTrigger`/`PopoverContent`; `Command`/`CommandInput`/`CommandList`/
  `CommandGroup`/`CommandItem`.

## Styling idiom — Tailwind utilities + semantic tokens
Style with Tailwind classes that reference **semantic tokens**, never raw hex. Use the
token families so light/dark theming just works:

| Surface / role | Background | Foreground (text on it) | Border |
| --- | --- | --- | --- |
| App canvas | `bg-background` | `text-foreground` | `border-border` |
| Primary action | `bg-primary` | `text-primary-foreground` | — |
| Secondary / chips | `bg-secondary` | `text-secondary-foreground` | — |
| Brand accent (links, highlights) | `bg-accent` | `text-accent-foreground` | `border-accent` |
| Destructive | `bg-destructive` | `text-destructive-foreground` | `border-destructive` |
| Success / online | `bg-success` | `text-success-foreground` | `border-success` |
| Muted / disabled | `bg-muted` | `text-muted-foreground` | — |
| Card | `bg-card` | `text-card-foreground` | `border-border` |
| Popover / menu | `bg-popover` | `text-popover-foreground` | `border-border` |
| Inputs | `bg-background` | — | `border-input` |

Focus rings: `ring-ring` (`focus-visible:ring-2 focus-visible:ring-ring`). Radius:
`rounded-md` / `rounded-lg` (driven by the `--radius` token). Most components accept
`className` to extend their styling with these utilities.

Component variants are props, not classes: `Button`/`Badge` take
`variant="default|secondary|accent|destructive|success|outline|ghost|link"` (Badge has
no ghost/link) and `Button` takes `size="default|sm|lg|icon"`.

## Where the truth lives
- `styles.css` (imports `_ds_bundle.css`) — the full compiled stylesheet incl. every
  utility and the `--*` token values. Read it before inventing styles.
- Each component's `*.d.ts` (its props) and `*.prompt.md` (usage) under its folder.

## Idiomatic snippet
```tsx
<Card>
  <CardHeader>
    <CardTitle>Hypixel</CardTitle>
    <CardDescription>mc.hypixel.net</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex items-center gap-2">
      <Badge variant="success">Online</Badge>
      <span className="text-sm text-muted-foreground">48,302 players</span>
    </div>
  </CardContent>
  <CardFooter>
    <Button size="sm">View stats</Button>
  </CardFooter>
</Card>
```
