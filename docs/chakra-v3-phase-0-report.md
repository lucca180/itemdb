# Chakra UI v3 — Phase 0 report

Date: 2026-05-21  
Migration branch: `v3`  
Codemod spike branch: `chakra-v3/codemod-spike` (isolated worktree at `.worktrees/codemod-spike`)

Related plan: [chakra-v3-migration.md](./chakra-v3-migration.md)

## Summary

Phase 0 is complete. The pre-migration baseline on `v3` is green. The Chakra codemod was applied in a disposable worktree only; **its output must not be merged as-is**.

Before Phase 1, the team should explicitly confirm dependency changes in `package.json` (per project guardrails).

## Pre-migration baseline (`v3`, no codemod)

| Check | Result |
|-------|--------|
| `yarn lint` | Pass |
| `yarn typecheck` | Pass (0 TS errors) |

## Codemod execution

Command (official):

```bash
npx @chakra-ui/codemod upgrade
```

Location: `.worktrees/codemod-spike` on branch `chakra-v3/codemod-spike`.

### Diff size

| Metric | Value |
|--------|-------|
| Files changed | 191 |
| Insertions | ~8,636 |
| Deletions | ~7,945 |
| New untracked dir | `components/ui/` (4 snippet files) |

### Dependency changes (codemod-modified `package.json`)

| Change | Detail |
|--------|--------|
| Upgrade | `@chakra-ui/react` `2.10.7` → `^3.0.0` (resolves to `3.35.0`) |
| Upgrade | `@emotion/react` → `^11` |
| Remove | `@emotion/styled` |
| Add | `next-themes` `^0.4.6` |
| Unchanged (still present) | `@chakra-ui/icons`, `@choc-ui/chakra-autocomplete`, `framer-motion` |

Yarn peer warnings after install:

- `@choc-ui/chakra-autocomplete` expects Chakra v2 (`^2.5.5`).
- `@choc-ui/chakra-autocomplete` still requests `@emotion/styled` (removed by codemod).

## Post-codemod validation (worktree only)

| Check | Result |
|-------|--------|
| `yarn lint` | **Fail** — 3 errors, 266 warnings |
| `yarn typecheck` | **Fail** — **836** TS errors |

Lint errors (concrete):

- `components/Input/SortSelect.tsx:40` — duplicate JSX props
- `components/ui/color-mode.tsx:86`, `:102` — duplicate JSX props

## Classification of codemod changes

### Mechanical (mostly automated, still needs cleanup)

| Area | Codemod outcome | Remaining work |
|------|-----------------|----------------|
| `colorScheme` → `colorPalette` | ~253 renames | 1 leftover in `pages/item/[id].tsx` |
| `Divider` → `Separator` | Applied in many files | Spot-check layout |
| Boolean props (`isDisabled`, etc.) | Partial | Many `isOpen` / controlled-state props left on wrappers |
| `Modal` → `Dialog` compound | Shell added (`Dialog.Root`, `Backdrop`, `Positioner`, …) | Incomplete `onOpenChange`, empty headers, prop mismatches |
| `FormControl` → `Field` | Partial (~2 files still mention `FormControl`) | Large forms still mixed |
| Theme | `extendTheme` → `createSystem` | Export/import broken (see risky) |
| Provider prop | `theme={theme}` → `value={system}` | `system` not imported/exported correctly |
| Icons in TSX | `@chakra-ui/icons` imports removed from components | Package still listed in `package.json`; comment in `next.config.ts` only |
| Snippets | Added `components/ui/{provider,color-mode,toaster,tooltip}.tsx` | Not wired into `app/providers.tsx` / `pages/_app.tsx` |

### Risky (review carefully before adopting)

1. **Spurious `Steps` import** — prepended to ~150+ files (e.g. `import { Steps, Button, ... }`). Unused everywhere; likely codemod bug. Mass lint noise.
2. **Broken theme wiring** — `utils/theme.ts` defines `system` but `export default theme` (undefined). `app/providers.tsx` / `pages/_app.tsx` use `value={system}` while still importing `theme`.
3. **Color mode** — cookie managers (`cookieStorageManager`, `cookieStorageManagerSSR`) kept on v3 `ChakraProvider`; snippets use `next-themes` but entry points were not migrated. Dark-mode behavior needs an explicit decision (Phase 2).
4. **`@choc-ui/chakra-autocomplete`** — 6 select components untouched; incompatible with Chakra v3 peers after codemod.
5. **`useToast`** — still imported in **26** files; v3 has no `useToast`. Needs toaster snippet or project wrapper (Phase 3).
6. **Select → NativeSelect** — partial API migration (`variant`, `onValueChange`, `size` on wrong element types).
7. **Compound families incomplete** — `MenuButton` / `TabList` still present; `CardBody` mostly unchanged; `Switch` used as element, not compound.
8. **Suspicious non-UI diffs** — `public/js/animated-preview.js`, `public/js/easeljs.min.js`, `userscripts/hash.min.js` touched (likely false positives; revert in real migration).
9. **Wrong alias** — `pages/tools/rainbow-pool/[[...slug]].tsx` imports `@/components/ui/tooltip` (project uses `@components`).

Example modal after codemod (structure started, API still v2-ish at boundary):

```tsx
// components/Modal/LoginModal.tsx (excerpt)
<Dialog.Root open={isOpen} placement='center' onOpenChange={e => { if (!e.open) onClose(); }}>
  <Portal>
    <Dialog.Backdrop />
    <Dialog.Positioner>
      <Dialog.Content>
        <Dialog.Header></Dialog.Header>
        ...
```

### Manual (not covered by codemod)

| Item | Notes |
|------|-------|
| Provider + color mode integration | Choose cookies vs `next-themes` snippet; wire `components/ui/provider.tsx` |
| Toast layer | Replace 26 `useToast` call sites |
| Autocomplete replacement | 6 `*Select.tsx` files |
| Complete Dialog migration | ~35 modal components + pages using modals |
| Complete Field migration | Dense admin/forms |
| Menu / Tabs / Accordion / Card compounds | Per migration plan phases 5–6 |
| Style prop renames | `textColor` → `color`, `Text size` → `fontSize`, `Link isExternal`, Button `as` + `href` patterns |
| Remove `@chakra-ui/icons` from `package.json` | After icon migration |
| Evaluate `framer-motion` removal | Still in deps; codemod did not remove it |

### Common TypeScript error themes (836 total)

| Theme | Examples |
|-------|----------|
| Missing / wrong exports | `useToast`, `theme` vs `system`, `@/components/ui/tooltip` |
| v3 prop types | `textColor`, `size` on `Text`, `variant` on `NativeSelect`, `isExternal` on `Link` |
| Compound components | `Switch`, `Menu`, `Tabs`, `Card` not fully migrated |
| Controlled state | `isOpen` references left after rename to `open` on Dialog only |
| Prisma generated client | Errors in worktree likely from missing `prisma generate` in that clone; baseline `v3` has 0 such errors |

## Recommendation

| Decision | Recommendation |
|----------|----------------|
| Use codemod output as merge base? | **No** — treat as reference diff only |
| Proceed to Phase 1 (deps)? | **Yes, after explicit user confirmation** for `package.json` / lockfile |
| Suggested Phase 1 order | Deps → fix theme export + provider → color mode strategy → then mechanical/compound PRs |
| Keep worktree? | Yes, for comparison until Phase 2 starts; delete with `git worktree remove .worktrees/codemod-spike` when done |

## Isolation checklist (Phase 0 acceptance)

- [x] Pre-migration failure baseline documented (`v3`: lint + typecheck green)
- [x] Codemod changes isolated in `chakra-v3/codemod-spike` worktree (not on `v3` working tree)
- [x] Codemod output classified (mechanical / risky / manual)
- [ ] **Pending:** explicit team confirmation to change dependencies (`package.json`)

## Worktree cleanup (when no longer needed)

```bash
git worktree remove .worktrees/codemod-spike
git branch -D chakra-v3/codemod-spike
```
