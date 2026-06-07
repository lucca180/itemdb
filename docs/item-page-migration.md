# Migração da item page para Server Components

Plano gradual para mover a UI de `/item/[slug]` de um monólito client para composição server-first, com ilhas client só onde há estado, auth, fetch client-side ou interatividade pesada.

Rota: [`app/[locale]/item/[slug]/page.tsx`](../app/[locale]/item/[slug]/page.tsx)  
Loader principal: [`app/utils/loadItemPage.ts`](../app/utils/loadItemPage.ts)  
Orquestrador: [`app/_components/Item/page/ItemPage.tsx`](../app/_components/Item/page/ItemPage.tsx)  
Review fixes (pós PR #22): [`item-page-review-fixes.md`](./item-page-review-fixes.md)

## Estrutura (`app/_components/Item/`)

```
Item/
├── loadUtils.ts    # loaders compartilhados (NP prices, NC insights, last seen, trade lists, …)
├── page/           # composição da página (ItemPage, header, client gates, sidebars)
├── drops/          # ItemDropsSection, loaders, ilhas client de drops
├── similarItems/   # SimilarItemsCard + fallback shell
├── ItemParent/     # ItemParent (server + fetch) + ItemParentGrid (client toggle)
├── mme/            # MMECard
├── dye/            # DyeCard
├── recipes/        # ItemRecipesCard
├── Petpet/         # PetpetCard
├── Comments/       # ItemCommentsCard
├── Avy/            # ItemAvyCard + ItemAvyCardList
├── Trade/          # TradeCardSection
├── NCTrade/        # NCTradeSection + MatchTable, TradeInsights, NCTradeHistory, …
├── Price/          # ItemPriceSection (server) + ItemPriceCard (client shell)
├── MyLists/        # MyListsSection (server) + MyListsCard (client island)
└── ManualCheck/    # ManualCheckSection (server) + ManualCheckCard (client island)
```

Cards genéricos de display (sem fetch App Router) permanecem em [`components/Items/`](../components/Items/) — ex.: `ItemEffectsCard`, `FindAtCard`, `ColorInfoCard`.

Legacy removido da item page App Router:

- [`components/Price/`](../components/Price/) — deletado; UI em `Price/`
- [`components/NCTrades/index.tsx`](../components/NCTrades/index.tsx) — re-export de `NCTradeSection`; UI real em `NCTrade/`
- [`components/NCTrades/NCTradeHistory.tsx`](../components/NCTrades/NCTradeHistory.tsx) — mantido só para mall report (`NCTradeCard`, Pages Router)

### `loadItemPage.ts` — o que bloqueia o render

| Campo | Itens | Loader |
|-------|-------|--------|
| `colors`, `lists`, `itemEffects`, … | todos | fetch central |
| `tradeLists` | NC (`shouldShowTradeLists`) | `getItemLists(iid, false)` |
| `ncTradeInsights` | NC | `loadNCTradeInsights` |
| `npPrices`, `npPriceStatus` | NP | `loadNPPrices`, `loadPriceStatus` (+ user para status) |

Seções self-contained (MME, dye, recipes, parent, drops, petpet, …) **não** passam pelo loader central.

### `loadUtils.ts`

Loaders compartilhados entre seções (`React.cache` / `unstable_cache`):

| Export | Uso |
|--------|-----|
| `loadNPPrices` | Price (preload + dedupe) |
| `loadPriceStatus` | Price modals / help banner |
| `loadLastSeen` | Price last seen, `ItemRestock` |
| `loadTradeLists` | NP seeking/trading tabs |
| `loadNCTradeInsights` | NC preload |
| `loadLebronTradeHistory` | NC owls tab |
| `getOfficialItemLists` | dedupe de listas oficiais |

### `ItemParent/` — mínimo de arquivos

Só **dois arquivos** (sem `loadItemParent.ts` separado):

| Arquivo | Papel |
|---------|--------|
| [`ItemParent.tsx`](../app/_components/Item/ItemParent/ItemParent.tsx) | Server: `unstable_cache` inline + `Suspense` + `CardBase` + i18n |
| [`ItemParentGrid.tsx`](../app/_components/Item/ItemParent/ItemParentGrid.tsx) | Client: toggle show more/less (única ilha necessária) |

Fetch via `getItemParent` no server; **nenhum request no client**. Dados removidos de `loadItemPage` (self-contained como MME/dye/recipes).

### `Price/` — padrão NCTrade

| Arquivo | Papel |
|---------|--------|
| [`ItemPriceSection.tsx`](../app/_components/Item/Price/ItemPriceSection.tsx) | Server orchestrator: stat, tabela, help, tabs |
| [`ItemPriceCard.tsx`](../app/_components/Item/Price/ItemPriceCard.tsx) | Client shell: tab bar, painéis, modais, chart |
| [`itemPriceUtils.ts`](../app/_components/Item/Price/itemPriceUtils.ts) | Helpers puros |

**Loading:** `npPrices` + `npPriceStatus` preloadados em `loadItemPage` (bloqueiam render). Last seen e NP seeking/trading streamam via Suspense. `MatchTable` reutilizado de `NCTrade/`. Chart monta só com `activeTab === 'chart'` (`lightweight-charts` não renderiza em `display: none`).

### `NCTrade/` — consolidação

Server orchestrator [`NCTradeSection.tsx`](../app/_components/Item/NCTrade/NCTradeSection.tsx) + ilhas client (`NCTradeTabBar`, `NCTradePanel`). UI toda em `NCTrade/` — sem shell client legado.

**Loading:** `ncTradeInsights` preloadado em `loadItemPage`. Seeking bloqueia (Suspense); trading, owls e label da tab owls streamam em paralelo.

## Convenções

| Critério | Onde |
|----------|------|
| Só renderiza props, `getTranslations` / `getFormatter` | [`components/Items/`](../components/Items/) (async server) |
| Fetch, `unstable_cache`, Suspense, lógica App Router | [`app/_components/Item/<feature>/`](../app/_components/Item/) — loader inline no componente server quando couber; `load*.ts` ou [`loadUtils.ts`](../app/_components/Item/loadUtils.ts) se compartilhado |
| Hooks, auth, modais, SWR | Client island (`'use client'`) |
| Utils de loader | Prefixo `load*` — evitar mesmo nome que o componente |
| `ItemCard` em server | Server components podem renderizar `<ItemCard />` direto; a fronteira client fica no `ItemCard`, não num wrapper grid |
| Tracking | `data-umami-event*` + `Link` do `@i18n/navigation` (não `MainLink` em server) |
| Links com ícone | [`IconLink`](../components/Utils/IconLink.tsx) — externo via `isExternal`; interno (`/path`) usa `@i18n/navigation` |

**Regra:** não alterar comportamento de componentes existentes sem confirmar efeitos colaterais (props, dados do loader, UX admin, etc.).

**Preferência:** evitar arquivos novos — loader inline no server component; ilha client separada só quando houver hooks/estado.

---

## Meta transversal: reduzir i18n no client

Objetivo: **eliminar `useTranslations` / `useFormatter` das ilhas client da item page**, não necessariamente eliminar todo `'use client'`.

### Princípio

- **Server:** `getTranslations()` / `getFormatter()` de `next-intl/server`
- **Client:** recebe strings ou `ReactNode` já traduzidos via props (`labels`, `title`, etc.)
- **Não** significa mandar o JSON completo de traduções — props serializam só as strings usadas

### Feito ✅

- Fallbacks de Suspense (drops, similar items) — server passa `title`
- `ItemParentGrid`, `ColorInfoCardPalette` — `labels` do shell server
- `ItemPageEditSection` — `labels` de `ItemPage` (botões report/edit)
- Drops (`ItemDropsContent`, `ItemDropPool`, `OldPoolDrops`) — copy pré-renderizada no server
- Fase 5 cards — fetch próprio; i18n no server onde possível
- `EffectCard` — `typeName` passado do server; tipos em [`effectTypes.ts`](../components/Items/effectTypes.ts) (fix RSC)
- **`NCTrade/`** — zero `useTranslations` na árvore da item page NC
- **`ItemPriceSection`** — labels de tabs e copy estática no server; stat formatado no server
- **`MyLists/`** — `MyListsSection` server + `MyListsCard` client com `labels` do server
- **`ManualCheck/`** — `ManualCheckSection` server (auth admin) + `ManualCheckCard` client
- **`ItemPageWearablePreview`** — server shell; gate + `colorSpeciesEffect` no server; `ItemPreview` client via dynamic

### Pendente ⏳ (item page)

| Componente | Motivo |
|------------|--------|
| [`TradeCard`](../components/Trades/TradeCard.tsx) | título e copy da tabela |
| [`ItemCard`](../components/Items/ItemCard.tsx) | compartilhado; afeta similar items, parent, MME, dye, recipes, avy |
| [`AddToListSelect`](../components/UserLists/AddToListSelect.tsx) | sidebar; `useTranslations` + auth client |
| `EffectText` em `EffectCard` | `t.rich` dinâmico por tipo de efeito |
| [`EditItemModal`](../components/Modal/EditItemModal.tsx) | lazy fetch + copy client (`ItemPageAuthGates`) |
| [`ItemPreview`](../components/Items/ItemPreview.tsx) | wearable preview client island |

### Passos restantes (i18n)

1. **`TradeCard`** — shell server passa strings
2. **Modais compartilhados** — `EditItemModal`, modais de price (`CreatePriceModal`, etc.)
3. **`AddToListSelect`** — labels do server (sidebar)
4. **Layout global** — restringir `getMessages()` a namespaces mínimos em [`layout.tsx`](../app/[locale]/layout.tsx)
5. **Pages Router** — `_app.tsx` / modais compartilhados: por último ou quando a rota migrar

### Critério de done (item page)

- Nenhum `'use client'` na árvore da item page importa `useTranslations` ou `useFormatter`
- Strings dinâmicas por estado client (erros de API, etc.) documentadas como exceção explícita
- **`ItemCard`** tratado como exceção documentada até migração própria ou props de labels

---

## Fases

### Fase 0 — Shell ✅

- [`ItemPage.tsx`](../app/_components/Item/page/ItemPage.tsx) server + `ItemHeader` + client islands mínimas (sidebar, edit)
- Wiring em `page.tsx`

### Fase 1 — Vitórias rápidas ✅

Server em `components/Items/`: `MissingInfoCard`, `NcMallCard`, `ItemEffectsCard`, `ItemOfficialLists`, `RelatedLinksCard`, `ItemRestock` (fetch próprio de last seen via `loadUtils`)

### Fase 2 — Sidebar / display leve ✅ (parcial)

- `FindAtCard`, `ItemInfoCard`, `ColorInfoCard` (+ ilhas client mínimas: palette, `InfoTip`)
- Breadcrumbs: revertido para client (`ItemBreadcrumb`); refator mínima futura se necessário

### Fase 3 — Drops / parent (streaming) ✅

- [`loadItemDrops.ts`](../app/_components/Item/drops/loadItemDrops.ts) com `unstable_cache`
- `ItemDropsSection` — gate + Suspense; fetch fora do `loadItemPage`
- [`ItemParent/`](../app/_components/Item/ItemParent/) — fetch próprio; removido de `loadItemPage` e de `components/Items/`
- Admin edit com lazy fetch de `itemOpenable`

### Fase 4 — Híbridos com `ItemCard` client ✅

- [`SimilarItemsCard`](../app/_components/Item/similarItems/SimilarItemsCard.tsx) — server + `loadSimilarItems` + Suspense + fallback shell
- [`MMECard`](../app/_components/Item/mme/MMECard.tsx), [`DyeCard`](../app/_components/Item/dye/DyeCard.tsx), [`ItemRecipesCard`](../app/_components/Item/recipes/ItemRecipesCard.tsx) — server, fetch próprio, gates
- Dados removidos de `loadItemPage` (`mmeData`, `dyeData`, `itemRecipes`, `itemParent`)

### Fase 5 — Híbridos complexos ✅

- [`PetpetCard`](../app/_components/Item/Petpet/PetpetCard.tsx), [`ItemCommentsCard`](../app/_components/Item/Comments/ItemCommentsCard.tsx), [`ItemAvyCard`](../app/_components/Item/Avy/ItemAvyCard.tsx)
- [`TradeCardSection`](../app/_components/Item/Trade/TradeCardSection.tsx) — server fetch + client `TradeCard`
- Dados removidos de `loadItemPage` (`petpetData`, `avyData`, `NPTrades`)

### Fase 6 — Price + NCTrade ✅

**Price**

- [`ItemPriceSection`](../app/_components/Item/Price/ItemPriceSection.tsx) + [`ItemPriceCard`](../app/_components/Item/Price/ItemPriceCard.tsx)
- Preload `npPrices` + `npPriceStatus` em `loadItemPage`
- `getPriceStatus` compartilhado com API route; loaders em `loadUtils.ts`
- Legacy `components/Price/*` removido
- Wiring direto em `ItemPage`

**NCTrade**

- UI consolidada em [`NCTrade/`](../app/_components/Item/NCTrade/)
- Preload `ncTradeInsights` em `loadItemPage` (mantido — bloqueia render)
- `components/NCTrades/index.tsx` → re-export apenas

### Fase 7 — Encolher client ✅

- [`MyLists/`](../app/_components/Item/MyLists/) — `MyListsSection` server (auth + i18n) + `MyListsCard` client island
- [`ManualCheck/`](../app/_components/Item/ManualCheck/) — `ManualCheckSection` server (auth admin) + `ManualCheckCard` client island
- [`ItemPageWearablePreview`](../app/_components/Item/page/ItemPageWearablePreview.tsx) — server shell; `ItemPreview` client via dynamic
- Sidebars desktop/mobile — layout server em `ItemPage`; só `AddToListSelect` permanece client
- `ItemPageClientCards.tsx` removido; auth gates (`ItemPageAdminOnly` / `ItemPageUserOnly`) substituídos por checks server nas sections

Ainda client (necessário):

- [`ItemPageAuthGates`](../app/_components/Item/page/ItemPageAuthGates.tsx) — `ItemPageEditSection`: auth, `EditItemModal`, lazy fetch openable/petpet
- [`ItemPageOutfitSection`](../app/_components/Item/page/ItemPageOutfitSection.tsx) + `ItemOutfit` client
- [`AddToListSelect`](../components/UserLists/AddToListSelect.tsx) — sidebar add-to-list
- [`ItemBreadcrumb`](../components/Breadcrumbs/ItemBreadcrumb.tsx) em [`ItemHeader`](../app/_components/Item/page/ItemHeader.tsx) (server shell + breadcrumb client)

---

## O que falta para terminar a migração

### A. Funcional / arquitetura item page ⏳

| Item | Prioridade | Notas |
|------|------------|-------|
| i18n client restante | Alta | `TradeCard`, `ItemCard`, `AddToListSelect`, `EditItemModal`, `ItemPreview` — ver tabela acima |
| Breadcrumbs server | Baixa | revertido para client; refator mínima se valer a pena |

### B. Infra / qualidade (review fixes) ⏳

Ver [`item-page-review-fixes.md`](./item-page-review-fixes.md):

| Fase | Tema |
|------|------|
| 3 | Cache tags + `revalidateTag` admin (MME, dye, recipes, parent, drops, price loaders) |
| 4 | Metadata leve, `Promise.allSettled`, Suspense fallbacks, error boundaries |
| 5 | ISR vs dynamic, `bdData`, testes automatizados (`resolveItemPage`, smoke por tipo de item) |

### C. Critério de “migração concluída”

Consideramos a migração **estruturalmente concluída** quando:

- [x] Todos os cards da coluna principal são server orchestrators em `app/_components/Item/`
- [x] Dados críticos de above-the-fold (NC insights, NP prices) preloadados em `loadItemPage`
- [x] Legacy `components/Price/*` removido da item page
- [ ] Nenhuma ilha client da item page usa `useTranslations` / `useFormatter` (exceto exceções documentadas)
- [ ] Checklist manual verde (NP/NC/wearable/admin, en+pt, lint+typecheck)
- [ ] (Opcional) cache tags + testes do review fixes

---

## Verificação por PR

- Item NP e NC, wearable, openable, MME, dyeworks, recipes, parent, admin logado
- NP: tabs price (table/chart/seeking/trading), modais, help banner, last seen
- NC: tabs trade (seeking/trading/insights/owls), badge de valor
- Locales `en` e `pt`
- `yarn lint` + `yarn typecheck`
- Sem regressão de ordem dos cards (orquestrador = fonte de verdade em `ItemPage.tsx`)
