# Restock Review 2026

Nov 1, 2026 · @lucca · [doc original](https://claude.ai/artifact/9pucNr9wSMjYjkkm1dbqoH)

## Resumo

O Restock Review 2026 troca a página longa de rolagem por stories em tela cheia, com imagens prontas para compartilhar. Em 2025, só 242 das 912 pessoas que usaram o restock receberam o Review (27%), e a página do Review não tinha botão de compartilhar.

As metas desta edição:

- Gerar o Review para todo mundo que tem sessões em 2026 (998 pessoas até outubro), sem fila de espera.
- Fazer o compartilhamento ser o produto: imagem de story e selo para petpage.
- Medir tudo no Umami desde o primeiro dia, o que não aconteceu em 2024 nem em 2025.
- Lançar por volta de 15/12, antes das festas, com dados de 01/01 a 30/11. Dezembro fica de fora e não há atualização depois.

Trabalho na branch `feat/restock-review-2026`.

Em 13/11/2026 começou a análise para ampliar o escopo a quem não usa o restock e a deslogados (seção Ampliação do escopo).

## Status: etapa 1 (planejamento e demo)

Atualizado em 02/11/2026. A etapa 1 entrega o plano e uma demo navegável com dados mockados; nada aqui lê dados reais nem mexe no banco.

**Feito**

- Análise das edições 2024/2025 e este plano, com as quatro decisões tomadas (seção Decisões).
- Protótipo visual dos slides, do story e do selo: [canvas de design](https://claude.ai/artifact/7C3ej8ddMrWbRHqfKznqrc).
- Rota `/demo` (`app/[locale]/demo/page.tsx`), com `noindex`/`nofollow`, que mostra os 11 slides em formato de stories:
    - Navegação por toque (terço esquerdo volta, o resto avança), setas do teclado e botões, com barra de progresso.
    - Slide desenhado em 405×720 e escalado para caber na tela, no desktop e no celular.
    - Story de 1080×1920 gerado no navegador com `useToPng` (Baixar, Copiar, Enviar) e prévia do selo para petpage nas versões escura e lime.
- Componentes em `components/Hubs/RestockReview/`:
    - `mockData.ts`: tipo `RestockReviewData` (o formato que o processamento em lote vai ter que gerar), dados de exemplo e cálculo da maior sequência.
    - `reviewTheme.ts`: cores, temas por slide e fontes via `next/font/google` (Bricolage Grotesque, DM Sans, Silkscreen).
    - `ReviewSlides.tsx`: um componente por slide.
    - `ReviewShare.tsx`: imagem de story, selo e botões de compartilhar.
    - `ReviewStories.tsx`: o player.
- Textos em EN e PT no namespace `RestockReview`, com números e datas no formato de cada idioma.
- Lint e typecheck passando; testado no navegador em EN e PT, no desktop e no celular (375px).

**Falta nesta etapa**

- Conferir Baixar e Enviar e a imagem gerada num navegador comum. No navegador usado nos testes, a cópia foi bloqueada por permissão de área de transferência.
- Escrever o texto dos outros cinco tipos de restocker. Hoje só "Fiel à loja" tem descrição própria.
- Definir a rota final do Review. `/demo` é provisória.

**Próximas etapas** (detalhes em Plano técnico)

1. Corrigir os bugs listados, a começar pela duração com abas simultâneas.
2. Mudança no schema para guardar o agregado anual (depende da sua confirmação) e o script em lote.
3. Trocar a geração da imagem no navegador por rotas `next/og` para o story e o selo.
4. Ligar a página aos dados reais, com estado vazio para quem não comprou nada.
5. Resumo da comunidade e eventos no Umami (`review-slide`, `review-share`, `review-badge-copy`).

## Retrospectiva 2024/2025

A edição 2025 foi uma cópia da 2024 com o ano trocado, e as duas alcançaram poucas pessoas. Números do banco (consultas de leitura em 01/11/2026):

|  | 2024 | 2025 |
| --- | --- | --- |
| Lançamento | 28/12/2024 | 30/12/2025 |
| Pessoas com Review processado | 138 (115 prontos) | 242 (231 com dados) |
| Pessoas que usaram o restock no ano | sem dado | 912 |
| Tempo com link no site | sem dado | ~3 semanas (saíram em 21/01/2026) |

Pessoas distintas com sessões de restock por mês (tabela `RestockSession`, consulta de 01/11/2026):

| Mês | 2025 | 2026 |
| --- | --- | --- |
| jan | 251 | 336 |
| fev | 255 | 297 |
| mar | 263 | 316 |
| abr | 257 | 321 |
| mai | 270 | 321 |
| jun | 274 | 368 |
| jul | 284 | 406 |
| ago | 290 | 372 |
| set | 278 | 366 |
| out | 314 | 332 |
| nov | 330 | |
| dez | 355 | |

O público do restock cresceu 62% do início de 2025 ao pico de julho de 2026, então o alcance do Review 2026 tende a ser maior se ninguém ficar na fila.

O Umami só começa em 09/03/2026 e não há nenhum evento do Review. Não sabemos quantos abriram, quantos chegaram ao fim nem quantos compartilharam. Como referência, o `/restock/dashboard` tem cerca de 2,5 mil visitantes por mês.

**O que funcionou**

- Dados que só o itemdb tem: item favorito, compra mais rápida, itens perdidos e o NP que deixou de ganhar.
- Tom bem-humorado ("Must be bots am I right?").
- O Restock Card do dashboard tem copiar, baixar e compartilhar nativo.

**O que não funcionou**

- Página longa de rolagem (739 linhas), duplicada em `2024.tsx` e `2025.tsx`.
- Todo texto em inglês fixo. O namespace de tradução é carregado, mas não é usado.
- Nenhum botão de compartilhar na página do Review. O Restock Card é outra coisa, de um período qualquer, em 325×450, gerado no navegador.
- Entrada por fila de espera, com barreira de contribuição (precificar trades ou votar).
- O `CTACard` que divulgava o Review não é mais usado em lugar nenhum.

## Bugs e dívidas técnicas

O código atual tem seis problemas que precisam ser resolvidos antes de reaproveitar qualquer parte. O pior para os usuários é o tempo de restock inflado: a estatística de "tempo gasto" está errada para quem usa várias abas.

| # | Problema | Onde | Efeito |
| --- | --- | --- | --- |
| 1 | Sessões em abas simultâneas são somadas na duração | `calculateStats` (`pages/api/v1/restock/index.ts`) | Média de 920 h por pessoa em 2025; máximo de 24.230 h, mais que as 8.760 h do ano |
| 2 | O `create` da fila não passa `year` e grava o padrão 2024 | `getWrapped`, `pages/api/v1/restock/wrapped.ts` | 128 registros "2024 / não pronto" que o PATCH põe de novo na fila todo mês |
| 3 | Elegibilidade usa `lt: new Date(year, 11, 1)` e filtra por `addedAt` | `getWrapped` | Quem só tem sessões em dezembro fica de fora |
| 4 | Sem compras no ano, `favoriteItem` lança erro | `getWrapped` | A página mostra "An error occurred" |
| 5 | A fila processa 3 pessoas por execução, mês a mês | PATCH de `wrapped.ts` | O processamento de 2025 levou de 28/12/2025 a 21/01/2026 |
| 6 | `priceHistoryMap` é global no módulo e nunca é limpo | `wrapped.ts` | Memória do processo cresce a cada execução |

O histórico de 2024 e 2025 fica como está. As correções valem para o cálculo de 2026.

## Proposta 2026: stories e dados novos

O Review vira uma sequência de slides em tela cheia (9:16 no celular), avançando com toque ou setas. Cada slide mostra um dado, com animação curta, e o último traz o resumo com o botão de compartilhar. Sai a rolagem longa e a biblioteca `react-vertical-timeline`.

**Ordem dos slides (rascunho)**

1. Abertura: "Seu 2026 no restock", com o nome da pessoa.
2. Horas, sessões e lojas visitadas, com a duração já corrigida.
3. Loja do ano, com a imagem do lojista.
4. Item favorito: o que mais comprou.
5. Compras mais valiosas: top 5 com o preço na época.
6. Compra mais rápida.
7. "O que escapou": o item mais caro perdido e o NP que deixou de ganhar.
8. Mapa de calor de 01/01 a 30/11, com a maior sequência e o melhor dia.
9. Comparação com a comunidade: "mais rápido que 87% dos restockers do itemdb".
10. Tipo de restocker (a revelação).
11. Resumo e compartilhar.

**Tipo de restocker**

Uma categoria calculada a partir das sessões, pensada para ser a peça que a pessoa compartilha. Todos os dados já existem em `RestockSession` (timestamps, cliques, `haggle_timestamp`, loja). Nomes provisórios:

| Tipo | Critério |
| --- | --- |
| Coruja | A maior parte das compras de madrugada, no horário NST |
| Sniper | Tempo de reação entre os mais rápidos da comunidade |
| Maratonista | Sessões mais longas que a média |
| Fiel à loja | Uma loja concentra a maior parte do tempo |
| Explorador | Muitas lojas diferentes no ano |
| Pechincheiro | Proporção alta de compras com pechincha |

Os limites de cada tipo saem da distribuição real de 2026, calculada no processamento em lote.

## Compartilhamento

As imagens passam a ser geradas no servidor com `next/og`, reaproveitando a base dos goal counters (`utils/goalCounter/renderShared.tsx`: fontes, BrandMark, paleta e conversão de GIF para PNG). A marca segue a regra dos goal counters: só o ícone (`public/logo_icon.svg`), nunca o logotipo escrito.

| Formato | Tamanho | Para quê |
| --- | --- | --- |
| Story | 1080×1920 | Instagram, TikTok e Discord |
| Selo para petpage | Pequeno, como os goal counters | Colar em lookups e petpages do Neopets |

**Selo para petpage**

Nenhum outro site faz isso, e o hábito já existe: o pessoal cola goal counters em petpages. O selo mostra o tipo de restocker e um ou dois números, com o ícone do itemdb.

**Resumo da comunidade**

Uma página aberta a todos, "o restock do itemdb em 2026": total comprado por todos, item mais comprado e loja mais movimentada. Atende quem não tem Review, funciona como porta de entrada e ajuda no SEO.

## Plano técnico

O Review de 2026 é calculado uma vez, em lote, para todas as cerca de 1.000 pessoas com sessões no ano, e guardado pronto para leitura. A fila de espera, a barreira de contribuição e o PATCH mês a mês saem.

**Processamento**

1. Corrigir a duração em `calculateStats`: juntar os intervalos sobrepostos das sessões antes de somar.
2. Script em lote, rodado no começo de dezembro, com dados de 01/01 a 30/11 (em NST).
3. Para cada pessoa, salvar o agregado do ano, o mapa de calor diário, a maior sequência, o melhor dia e o tipo de restocker.
4. Uma segunda passada sobre os agregados calcula as distribuições da comunidade (percentis e limites dos tipos) e o resumo público.
5. Sem reprocessamento em janeiro: dezembro fica de fora do Review 2026.

Guardar o agregado anual provavelmente pede mudança no schema (`RestockWrapped` / `WrappedSettings`). A mudança só entra depois da sua confirmação, e a migração é você quem roda.

**Páginas e imagens**

- Uma página de stories com o ano como parâmetro, no lugar de copiar o arquivo do ano anterior.
- Rotas `next/og` para story e selo, terminando em `.png` para o `proxy.ts` pular o i18n.
- Todos os textos em `translation/en.json` e `translation/pt.json`, testados nos dois idiomas.
- Estado vazio para quem não comprou nada, em vez de erro.

**Eventos no Umami**

| Evento | Quando dispara | Dados |
| --- | --- | --- |
| `review-slide` | Cada slide visto | número do slide |
| `review-share` | Baixar, copiar ou compartilhar nativo | formato e ação |
| `review-badge-copy` | Cópia do selo para petpage | variante |

Os acessos ao selo não aparecem no Umami e precisam dos logs do Cloudflare, como nos goal counters.

## Calendário

| Etapa | Período |
| --- | --- |
| Decisões e protótipos | 02/11 a 13/11 |
| Correções e script em lote | 09/11 a 27/11 |
| Stories, imagens e i18n | 16/11 a 09/12 |
| Processamento em lote | 01/12 a 05/12 |
| Testes em EN e PT | 07/12 a 11/12 |
| **Lançamento** | **15/12** |

O lançamento fica em 15/12, duas semanas antes das edições anteriores (28/12 e 30/12).

## Decisões

- [x] **Barreira de contribuição:** liberado para todos, sem fila nem contribuição.
- [x] **Link público:** não entra em 2026.
- [x] **Selo e resumo da comunidade:** entram em 2026.
- [x] **Data de lançamento:** 15/12, com dados de 01/01 a 30/11.

Os protótipos e a demo já foram feitos (seção Status).

## Ampliação do escopo (em análise)

Atualizado em 13/11/2026. A ideia é que o Review 2026 também atenda quem usa o itemdb sem o restock dashboard e quem visita deslogado, com estatísticas e curiosidades sobre itens, preços e listas. Esta seção é só análise: nada de código foi escrito para ela.

### Públicos

Consultas de leitura no banco de 01/01 a 13/11/2026; Umami de 09/03 a 12/11/2026.

| Grupo | Pessoas em 2026 |
| --- | --- |
| Contas que fizeram login | 4.566 (de 6.425 no total; 2.680 contas criadas em 2026) |
| Usaram o restock (`RestockSession`) | 1.024 |
| Fizeram algo fora do restock | 2.396 |
| ↳ sem nenhuma sessão de restock | **1.812** |
| ↳ com restock também | 584 |
| Fizeram login e não deixaram nenhum rastro no banco | **1.754** |
| Visitantes no Umami | ~770 mil (8,4 milhões de pageviews) |

"Algo fora do restock" é: criou lista, adicionou item a lista (listas não oficiais), enviou `Feedbacks` (inclui `tradePrice`), votou em `FeedbackVotes` ou reportou `NCTrade`.

Com isso, o Review pessoal passa de cerca de 1.000 para cerca de 2.800 contas. As 1.754 contas sem rastro e o público deslogado só podem receber a parte da comunidade.

Distinct users por fonte em 2026: listas criadas 1.761, itens adicionados a listas 1.862, `Feedbacks` 558, `FeedbackVotes` 456, `NCTrade` 272, `apiKeys` usadas 43, `DataCollecting` 18. Por tipo de `Feedbacks`: `tradePrice` 72.499 envios de 468 pessoas; `priceReport` 488 de 131 pessoas (+255 anônimos). Contas novas por mês: entre 187 (fev) e 328 (jul).

### Ideias para logados sem restock

**Listas**
- Listas criadas, itens adicionados, quantos vieram de importação e a maior lista.
- "Sua coleção valorizou X%": preço do item quando entrou na lista (`ListItems.addedAt` × histórico de `ItemPrices`) comparado com o preço atual. Também o item que mais valorizou e o que mais caiu.
- Valor total em NP das listas e o item mais caro que a pessoa tem ou procura.
- "Seu item mais raro": o item da lista que aparece em menos listas de outras pessoas. O contrário também: "você e outras 57 pessoas procuram o Coltzan Stamp".
- Progresso nas listas oficiais (checklists). Combina com o álbum de selos: os itens mais adicionados a listas em 2026 são quase todos selos.

**Contribuição**
- Lotes de trade precificados, votos, price reports e NC trades reportados.
- Posição em relação à comunidade ("entre os 5% que mais ajudaram a precificar").

**Conta**
- "Membro desde"; para contas criadas em 2026, "seu primeiro ano".

### Ideias para a comunidade (logados e deslogados)

Números de 2026 até 13/11:

| Dado | Valor |
| --- | --- |
| Atualizações de preço (`ItemPrices`) | 1.097.824, em 47.061 itens |
| Lotes de trade vistos (`Trades`) | 1.693.282 |
| Registros de restock / leilão (`RestockAuctionHistory`) | 25.677.167 / 984.366 |
| Aberturas reportadas (`OpenableItems`, opening_id distintos) | 205.011 |
| NC trades reportados | 4.392 |
| Listas criadas / itens adicionados a listas | 10.436 (6.267 dinâmicas) / 4.907.089 (1.648.484 importados, 73.042 itens distintos) |
| Buscas (`omni-search` no Umami) | 1.339.883 |

Rankings que já saem dos dados:

- Aberturas mais reportadas: Faerie Donation Capsule (10.622), 26th Anniversary Kougra Black Friday GBMC (5.420), NC Mall 19th Sleepover Birthday Mystery Capsule (4.192), Doctors Bag (3.850), Retired GBMC 2026 Mystery Capsule (3.826).
- NC mais trocados: 26th Anniversary Kougra Black Friday GBMC (382), Styling Studio Supplies (297), Styling Studio Prismatic Brush (204), Dyeworks Hue Brew Potion (146), Deluxe Styling Studio Supplies (128).
- Itens em mais listas de pessoas diferentes (sem importados e sem dinâmicas): ARGH!!!! DONNA STAMP (59), Coltzan Stamp (57), Midnight Jelly World Stamp (57), Queen Fyora Stamp (57), Commander Garoo Stamp (56).
- Páginas de item mais vistas (só o caminho `/item/` sem prefixo de idioma; falta somar os outros idiomas): Hungry Fungus (6.798), ARGH!!!! DONNA STAMP (5.686), Cool Negg (4.635), Drakaras Wand (4.119), Corrupted Staff of the Void (3.472).
- Preço mais volátil (mais atualizações no ano): Petpets Stamp (86), Festival Negg Collectable Charm (82), Bloody Ghost Toast (79), Mound of Rotten Fruit (79).

Outros formatos possíveis: item mais procurado (listas "seeking"), maiores altas e quedas de preço, dia de pico do site e um quiz para deslogados ("qual item ficou mais caro em 2026?") que termina com o convite para fazer login.

### Limitações dos dados

- **Não há itens visitados por pessoa.** O Umami é anônimo e a propriedade `loggedIn` só existe desde 17/10. "Os itens que você mais viu" não dá para fazer.
- **O ranking ingênuo de altas tem ruído.** Comparando o primeiro preço de 2026 (mínimo 10 mil NP, só NP) com o atual, o topo seria Nimmo Genealogy (10,6 mil → 999.998 NP, 94×), e o Snorkle Jelly aparece em 300 milhões. Precisa de filtro (por exemplo, mínimo de atualizações no ano) ou de revisão manual antes de virar slide.
- **Itens novos de 2026 não são confiáveis.** `releaseDate` está vazio para 2026, e `Items.addedAt` em 2026 tem 4.250 itens NC, 1.278 NP e 49 PB. Não está verificado se são lançamentos do ano ou dados importados depois.
- **`ActionLogs` não serve para o Review.** É praticamente só de admins (12 usuários em 2026).
- **Review pessoal sem login conflita com a decisão "Link público: não entra em 2026".**
- As consultas que cruzam `ListItems` com `UserList` levaram cerca de 45 s, e a sobreposição de públicos cerca de 35 s. Cabem no script em lote, não numa requisição.

### Perguntas abertas

1. Um Review único que mostra só os slides para os quais a pessoa tem dados (restock, listas, contribuição, comunidade), ou Reviews separados por tipo de usuário?
2. As 1.754 contas sem rastro recebem só a parte da comunidade, ou o Review pessoal nem aparece para elas?
3. Aprofundar a "valorização da coleção" e o ranking de altas e quedas com filtro anti-ruído, que são as ideias que mais dependem de validar os dados.

### Consultas usadas

Todas só de leitura. Sobreposição de públicos:

```sql
WITH act AS (
  SELECT user_id FROM UserList WHERE createdAt >= '2026-01-01' AND official = 0
  UNION SELECT l.user_id FROM ListItems li JOIN UserList l ON l.internal_id = li.list_id
    WHERE li.addedAt >= '2026-01-01' AND l.official = 0
  UNION SELECT user_id FROM Feedbacks WHERE addedAt >= '2026-01-01' AND user_id IS NOT NULL
  UNION SELECT user_id FROM FeedbackVotes WHERE addedAt >= '2026-01-01' AND user_id IS NOT NULL
  UNION SELECT reporter_id FROM NCTrade WHERE addedAt >= '2026-01-01'
), rs AS (SELECT DISTINCT user_id FROM RestockSession WHERE startedAt >= '2026-01-01'),
lg AS (SELECT id user_id FROM User WHERE last_login >= '2026-01-01')
SELECT (SELECT COUNT(*) FROM lg) logged2026,
  (SELECT COUNT(*) FROM act) active_nonrestock_signal,
  (SELECT COUNT(*) FROM act WHERE user_id NOT IN (SELECT user_id FROM rs)) active_without_restock,
  (SELECT COUNT(*) FROM rs WHERE user_id IN (SELECT user_id FROM act)) restock_and_other,
  (SELECT COUNT(*) FROM lg WHERE user_id NOT IN (SELECT user_id FROM act)
    AND user_id NOT IN (SELECT user_id FROM rs)) login_only;
```

Ranking ingênuo de altas de preço (com o ruído descrito acima):

```sql
WITH f AS (
  SELECT p.item_iid, p.price first_price FROM ItemPrices p
  JOIN (SELECT item_iid, MIN(addedAt) a FROM ItemPrices
        WHERE addedAt >= '2026-01-01' AND manual_check IS NULL GROUP BY item_iid) m
    ON m.item_iid = p.item_iid AND m.a = p.addedAt
), l AS (SELECT item_iid, price last_price FROM ItemPrices WHERE isLatest = 1)
SELECT i.name, f.first_price, l.last_price, ROUND(l.last_price / f.first_price, 1) x
FROM f JOIN l ON l.item_iid = f.item_iid JOIN Items i ON i.internal_id = f.item_iid
WHERE f.first_price >= 10000 AND i.isNC = 0
ORDER BY l.last_price / f.first_price DESC LIMIT 10;
```
