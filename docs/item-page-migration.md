# Migração da item page para Server Components

Plano gradual para mover a UI de `/item/[slug]` de um monólito client para composição server-first, com ilhas client só onde há estado, auth, fetch client-side ou interatividade pesada.

Rota: [`app/[locale]/item/[slug]/page.tsx`](../app/[locale]/item/[slug]/page.tsx)  
Loader principal: [`app/utils/loadItemPage.ts`](../app/utils/loadItemPage.ts)  
Orquestrador: [`app/_components/Item/page/ItemPage.tsx`](../app/_components/Item/page/ItemPage.tsx)  
Review fixes (pós PR #22): [`item-page-review-fixes.md`](./item-page-review-fixes.md)

## Estrutura (`app/_components/Item/`)

```
Item/
├── page/           # composição da página (ItemPage, header, client gates, sidebars)
├── drops/          # ItemDropsSection, loaders, ilhas client de drops
├── similarItems/   # SimilarItemsCard + fallback shell
├── parent/         # ItemParent (server + fetch) + ItemParentGrid (client toggle)
├── mme/            # MMECard
├── dye/            # DyeCard
└── recipes/        # ItemRecipesCard
```

Cards genéricos de display (sem fetch App Router) permanecem em [`components/Items/`](../components/Items/) — ex.: `ItemEffectsCard`, `FindAtCard`, `ColorInfoCard`.

### `parent/` — mínimo de arquivos

Só **dois arquivos** (sem `loadItemParent.ts` separado):

| Arquivo | Papel |
|---------|--------|
| [`ItemParent.tsx`](../app/_components/Item/parent/ItemParent.tsx) | Server: `unstable_cache` inline + `Suspense` + `CardBase` + i18n |
| [`ItemParentGrid.tsx`](../app/_components/Item/parent/ItemParentGrid.tsx) | Client: toggle show more/less (única ilha necessária) |

Fetch via `getItemParent` no server; **nenhum request no client**. Dados removidos de `loadItemPage` (self-contained como MME/dye/recipes). Só criar arquivo extra se a lógica de cache/load ficar grande demais para o componente server.

## Convenções

| Critério | Onde |
|----------|------|
| Só renderiza props, `getTranslations` / `getFormatter` | [`components/Items/`](../components/Items/) (async server) |
| Fetch, `unstable_cache`, Suspense, lógica App Router | [`app/_components/Item/<feature>/`](../app/_components/Item/) — loader inline no componente server quando couber; arquivo `load*.ts` só se a lógica crescer demais |
| Hooks, auth, modais, SWR | Client island (`'use client'`) |
| Utils de loader | Prefixo `load*` — evitar mesmo nome que o componente |
| `ItemCard` em server | Server components podem renderizar `<ItemCard />` direto; a fronteira client fica no `ItemCard`, não num wrapper grid |
| Tracking | `data-umami-event*` + `Link` do `@i18n/navigation` (não `MainLink` em server) |
| Links com ícone | [`IconLink`](../components/Utils/IconLink.tsx) — externo via `isExternal`; interno (`/path`) usa `@i18n/navigation` |

**Regra:** não alterar comportamento de componentes existentes sem confirmar efeitos colaterais (props, dados do loader, UX admin, etc.).

**Preferência:** evitar arquivos novos — loader inline no server component (ex. `parent/ItemParent.tsx`, `MMECard.tsx`); ilha client separada só quando houver hooks/estado (`ItemParentGrid`, `ItemDropPool`).

---

## Meta transversal: reduzir i18n no client

Objetivo: **eliminar `useTranslations` / `useFormatter` das ilhas client da item page**, não necessariamente eliminar todo `'use client'`.

### Princípio

- **Server:** `getTranslations()` / `getFormatter()` de `next-intl/server`
- **Client:** recebe strings ou `ReactNode` já traduzidos via props (`labels`, `title`, etc.)
- **Não** significa mandar o JSON completo de traduções — props serializam só as strings usadas

### Feito ✅

- Fallbacks de Suspense (drops, similar items) — server passa `title`
- `ItemParentGrid` (`app/_components/Item/parent/`), `ColorInfoCardPalette` — `labels` do shell server
- `ItemPageEditSection` — `labels` de `ItemPage`
- Drops (`ItemDropsContent`, `ItemDropPool`, `OldPoolDrops`) — copy pré-renderizada no server
- Fase 4 (`MMECard`, `DyeCard`, `ItemRecipesCard`, `SimilarItemsCard`) — `getTranslations` no server
- `EffectCard` — `typeName` passado do server (`ItemEffectsCard`)

### Pendente ⏳

- [`app/[locale]/layout.tsx`](../app/[locale]/layout.tsx) ainda passa `getMessages()` inteiro ao `NextIntlClientProvider`
- `EffectText` dentro de `EffectCard` ( `t.rich` dinâmico por tipo de efeito)
- **`ItemCard`** — `useTranslations` / `useFormatter` (compartilhado; afeta todos os grids)
- Cards ainda 100% client via `ItemPageClientCards`: price, NC trade, petpet, comments, BD, avy, trade, my lists, etc.

### Passos restantes

1. **Modais compartilhados** — `EditItemModal` ainda carrega copy client-side
2. **Layout global** — restringir `getMessages()` a namespaces mínimos no provider
3. **Pages Router** — `_app.tsx` / modais compartilhados: por último ou quando a rota migrar

### Critério de done (item page)

- Nenhum `'use client'` na árvore da item page importa `useTranslations` ou `useFormatter`
- Strings dinâmicas por estado client (erros de API, etc.) documentadas como exceção explícita
- **`ItemCard`** tratado como exceção documentada até migração própria ou props de labels

---

## Fases

### Fase 0 — Shell ✅

- [`ItemPage.tsx`](../app/_components/Item/page/ItemPage.tsx) server + `ItemHeader` + `ItemPageClientCards`
- Wiring em `page.tsx`

### Fase 1 — Vitórias rápidas ✅

Server em `components/Items/`: `MissingInfoCard`, `NcMallCard`, `ItemEffectsCard`, `ItemOfficialLists`, `RelatedLinksCard`, `ItemRestock`

### Fase 2 — Sidebar / display leve ✅ (parcial)

- `FindAtCard`, `ItemInfoCard`, `ColorInfoCard` (+ ilhas client mínimas: palette, `InfoTip`)
- Breadcrumbs: revertido para client (`ItemBreadcrumb`); refator mínima futura se necessário

### Fase 3 — Drops / parent (streaming) ✅

- [`loadItemDrops.ts`](../app/_components/Item/drops/loadItemDrops.ts) com `unstable_cache`
- `ItemDropsSection` — gate + Suspense; fetch fora do `loadItemPage`
- [`parent/ItemParent.tsx`](../app/_components/Item/parent/ItemParent.tsx) — fetch próprio (`unstable_cache` inline), gate interno (retorna `null` sem parents); [`ItemParentGrid.tsx`](../app/_components/Item/parent/ItemParentGrid.tsx) client só para show more/less; removido de `loadItemPage` e de `components/Items/`
- Admin edit com lazy fetch de `itemOpenable`

### Fase 4 — Híbridos com `ItemCard` client ✅

- [`SimilarItemsCard`](../app/_components/Item/similarItems/SimilarItemsCard.tsx) — server + `loadSimilarItems` + Suspense + fallback shell
- [`MMECard`](../app/_components/Item/mme/MMECard.tsx) — server, fetch próprio (`unstable_cache` inline), gate `isMME`
- [`DyeCard`](../app/_components/Item/dye/DyeCard.tsx) — server, fetch próprio, gate `isNC && isWearable`
- [`ItemRecipesCard`](../app/_components/Item/recipes/ItemRecipesCard.tsx) — server, fetch próprio, gate `!isNC`; links via `IconLink`
- Dados removidos de `loadItemPage` (`mmeData`, `dyeData`, `itemRecipes`, `itemParent`)
- Sem grids client intermediários — server renderiza `<ItemCard />` direto

### Fase 5 — Híbridos complexos ⏳

- Split `NCTrade`, `ItemAvyCard`, `ItemBdCard`, `TradeCard`, `PetpetCard`, `ItemComments`
- `PetpetCard` ainda em [`ItemPageClientCards`](../app/_components/Item/page/ItemPageClientCards.tsx)

### Fase 6 — Encolher client ⏳

- `ItemPageClientCards` reduzido a auth, price, preview, edit modal, etc.
- Header actions client mínimas

---

## Verificação por PR

- Item NP e NC, wearable, openable, MME, dyeworks, recipes, parent, admin logado
- Locales `en` e `pt`
- `yarn lint` + `yarn typecheck`
- Sem regressão de ordem dos cards (orquestrador = fonte de verdade em `ItemPage.tsx`)
