# Demo — página de categoria de listas oficiais

Protótipo (`/demo?cat=<slug>`, noindex) da nova página de categoria de listas oficiais.
Nada aqui é a implementação real; serve para validar URL, organização e visual antes de migrar.

## Decisões já tomadas

- **Sem WordPress.** O conteúdo muda pouco, então cada categoria é um config **em TS dentro do app router**.
  Local planejado na implementação real: `app/[locale]/lists/official/_categories/`.
- **Copy em inglês direto no config** (kicker, tagline, intro, FAQ). Sem tradução por enquanto.
- **URL U1:** `/lists/official/<category>` (+ opcional `/lists/official/<category>/<year>` para edições de evento).
  Hoje é `/lists/official/cat/<slug>` / `?cat=` — tráfego baixo no GSC (cat/stamps ~115 cliques, quest-log 27),
  então trocar com 301 é barato. As páginas de lista (ex.: `weekly-quest-prize`, 394 cliques) não mudam.
- **Visual:** direção B (hero imersivo) + FAQ e artigos relacionados da direção A. Direções A/C foram descartadas.
- **Cards** seguem o padrão do `components/UserLists/ListCard.tsx` (fundo `gray.700` + gradiente na cor da lista,
  capa sobreposta à esquerda, badges sólidos, texto escuro quando a cor é clara).
- **"Past editions"** (linhas por ano com chips) — aprovado.
- **Arquivamento puramente por data foi rejeitado:** um evento que acabou de terminar (ex.: Festival of Neggs 2026)
  não pode ir todo para o arquivo e deixar "atual" vazio. Por isso existe o conceito de **edições**: a edição mais
  recente é sempre o hero, mesmo encerrada.

## Estrutura

```
demo/
  page.tsx                 # server: lê ?cat, carrega listas ('use cache') + posts WP, resolve e passa ao client
  OfficialCatDemoClient.tsx # client: toolbar da demo, hero, cards, pools, edições, arquivo, FAQ, related, painel do config
  _categories/
    types.ts               # OfficialCategoryConfig, ListMatch, layouts
    quest-log.ts           # layout 'tracks'
    events.ts              # Festival of Neggs, Altador Cup — layout 'editions'
    resolve.ts             # resolveCategory(config, lists) -> ResolvedCategory
    index.ts               # registry + fallback para listCategoriesData (categorias sem config)
```

### Config (`types.ts`)

- `tags` / `legacyTags`: valores de `officialTag` usados no `ListService.getOfficialListsCat` (os tags no banco são
  inconsistentes, ex.: "Altador Cup" vs "Altador Cup 2026" são tags separadas).
- `ListMatch`: `slugs` exatos e/ou `slugPrefix` (string ou array), comparação case-insensitive.
- `archive?: ListMatch`: força listas para o arquivo (retired/legado) independente do layout.
- `layout`:
  - **`tracks`** — subcategorias com lista(s) atual(is) + histórico de pools. Ex. Quest Log:
    weekly (`weekly-quest-prize` + `old-weekly-quest-pool-*`), daily, neopass (+ `special-weekly-neopass-prize-*`),
    premium; arquivo = `retired-*-quest-prize`.
  - **`editions`** — agrupa por ano (`seriesStart` UTC; senão ano solto no slug, ex. Altador Cup 2008–2022 sem datas).
    `evergreen` = listas que valem para toda edição (ex. `altador-cup-sign-up-prizes`); `editionOrder` = ordem dentro do ano
    por prefixo de slug.
  - **`groups`** — grupos livres por match. Categorias sem config caem aqui com `groups: []` (tudo em "All lists").
- Qualquer lista que não casa com nada vai para **"Other lists"** — nada some da página.
- `faq`, `relatedArticles`, `kicker`, `tagline`, `intro`, `seoTitle`.

## Plano anti-colisão de slug (U1) — ainda não implementado

Categoria e lista oficial passam a dividir `/lists/official/<x>`. Hoje nenhum slug de lista oficial colide com
slug de categoria (checado read-only no banco).

1. `createListSlug(name, userId, isOfficial, excludeListId)` em `pages/api/v1/lists/[username]/index.ts`
   já trata oficiais como namespace compartilhado → quando `isOfficial`, adicionar os slugs do registry ao
   conjunto de "tomados" (gera `quest-log-2`).
2. Teste: slugs de categoria não podem ser numéricos nem reservados (`cat`, ids, etc.).
3. Teste/script read-only que acusa lista oficial existente com o mesmo slug ao adicionar categoria nova.
4. Na rota, categoria tem prioridade sobre lista.
5. Redirects 301: `/lists/official/cat/<slug>` e `?cat=` → nova URL (via `legacyTags` para mapear tags antigas).

## Estado atual

- Configurados: Quest Log (tracks), Festival of Neggs e Altador Cup (editions). O resto usa o fallback.
- Toolbar da demo: troca de categoria (✦ = tem config), toggle "Destacar o que vem do config" (contorno roxo) e
  painel com o JSON do config.
- Verificado no desktop: Quest Log, Festival of Neggs, Altador Cup, Stamps. Mobile só checado antes do rework dos cards.
- `yarn typecheck` e eslint da pasta limpos.

## Pendências / perguntas abertas

- Validar visual dos NowCards (padrão ListCard) e dos PoolTiles compactos.
- Contraste: cards amarelos sobre hero amarelo na Quest Log (sombra nos cards ou escurecer base do hero?).
- Como agrupar **Dailies** e **Stamps** (precisa de input — não assumir pelo nome/descrição das listas).
- Rechecar mobile e Festival of Neggs após o rework.
- Implementação real: rota U1 em `app/[locale]/lists/official/`, mover `_categories`, guard de slug, redirects,
  metadata/SEO por categoria.
