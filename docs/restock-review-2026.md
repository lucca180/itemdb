# Restock Review 2026

Nov 1, 2026 · @lucca · [doc original](https://claude.ai/artifact/9pucNr9wSMjYjkkm1dbqoH)

## Resumo

O Restock Review 2026 troca a página longa de rolagem por stories em tela cheia, com imagens prontas para compartilhar. Em 2025, só 242 das 912 pessoas que usaram o restock receberam o Review (27%), e a página do Review não tinha botão de compartilhar.

As metas desta edição:

- Gerar o Review para todo mundo que tem sessões em 2026 (998 pessoas até outubro), sem fila de espera.
- Fazer o compartilhamento ser o produto: imagem de story e selo para petpage.
- Medir tudo no Umami desde o primeiro dia, o que não aconteceu em 2024 nem em 2025.
- Lançar por volta de 15/12, antes das festas, com os dados que chegaram de 01/01 a 06/12 (corte final). O que chegar a partir de 07/12 fica de fora e não há atualização depois.

Trabalho na branch `feat/restock-review-2026`.

Em 13/11/2026 começou a análise para ampliar o escopo a quem não usa o restock e a deslogados (seção Ampliação do escopo). Em 18/11/2026 o Review passou a ter dois capítulos: **Neopia em 2026**, aberto a todos, e **Restock**, para quem tem sessões. O capítulo Pessoal foi descartado (seção Capítulos).

## Status: etapa 3 (quiz de personalidade)

Atualizado em 20/11/2026.

**Feito**

- O quiz de trivia com placar virou o quiz de personalidade da seção "Quiz de personalidade": 7 perguntas pessoais, alta e queda como bônus, resultado com tipo, descrição, piada, símbolo e dado do ano, e resultado genérico para quem pula perguntas. O capítulo Geral tem 22 slides.
- O story compartilhável mostra o tipo (ou o resultado genérico) no lugar do placar.
- Debug na demo: atalhos no canto da tela que pulam para o resultado de cada tipo e para o genérico.
- Textos em EN e PT no namespace `ReviewGeneral`. Lint e typecheck passando; testado no navegador em PT e EN, no desktop e no celular (375px).

**Falta**

- Revisar os textos marcados como "Ainda em revisão" na seção do quiz.
- Os itens da etapa 2 que continuam abertos (abaixo).

## Status: etapa 2 (capítulos e capítulo Geral)

Atualizado em 18/11/2026.

**Feito**

- `/demo` virou uma lista de capítulos (`ReviewHub.tsx`): o capítulo 1 usa dados reais de 2026 e o capítulo 2 é o Restock com os dados mockados da etapa 1.
- Player genérico (`StoriesPlayer.tsx`), usado pelos dois capítulos, em tela cheia por cima do site (no desktop o slide ocupa a altura toda; abaixo de 500px de largura ocupa a largura toda, sem bordas), com botão "Capítulos" (ou Esc) para voltar à lista. A navegação usa atualização funcional do índice: antes, toques rápidos ou setas seguidas pulavam menos slides do que deviam.
- Capítulo Geral (`GeneralSlides.tsx` e `generalData.ts`): 19 slides. **Hoje o código tem um quiz de trivia com placar**: 6 perguntas (item mais visto, caixa mais aberta, item que mais movimentou NP em leilões, preço do Muffin Baking Book, maior alta e maior queda), cada uma logo antes do slide que traz a resposta, e no fim um placar com título (Oráculo de Neopia, Magnata do Trading Post, Explorador Curioso ou Recém-chegado de Kreludor). O story compartilhável mostra esse placar. As respostas ficam no estado do capítulo, então voltar e avançar não as perde. **Esse formato vai ser trocado pelo quiz de personalidade** da seção "Quiz de personalidade", decidido em 18/11.
- Números abreviados com k, m, bi e tri em PT e com k, m, b e t em EN (`useGeneralFormat` em `GeneralSlides.tsx`).
- Corte final dos dados em 06/12 (`finalCutoff` em `generalData.ts`, `PERIOD_END` em `mockData.ts`).
- O compartilhamento virou um hook (`useShareImage`) e um componente (`SharePreview`) reutilizáveis.
- Textos em EN e PT no namespace `ReviewGeneral`. Lint passando; typecheck só com o erro antigo de `nextjs-progressbar` (pacote não instalado). Testado no navegador em EN e PT, no desktop e no celular (375px).

**Falta** (próxima sessão)

- Fechar o conteúdo e o tom dos slides do Geral com a demo.
- Recalcular os números do Geral no lote, a partir de 07/12, com dados até 06/12. Os livros ainda estão se ajustando depois da atualização de 02/11.
- Decidir se o Geral também ganha selo para petpage.

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
8. Mapa de calor de 01/01 a 06/12, com a maior sequência e o melhor dia.
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
2. Script em lote, rodado a partir de 07/12, com os dados que chegaram de 01/01 a 06/12 (em NST).
3. Para cada pessoa, salvar o agregado do ano, o mapa de calor diário, a maior sequência, o melhor dia e o tipo de restocker.
4. Uma segunda passada sobre os agregados calcula as distribuições da comunidade (percentis e limites dos tipos) e o resumo público.
5. Sem reprocessamento em janeiro: o que chegar a partir de 07/12 fica de fora do Review 2026.

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
| Corte final dos dados | 06/12 (último dia que entra) |
| Processamento em lote | 07/12 a 09/12 |
| Testes em EN e PT com os dados finais | 09/12 a 12/12 |
| **Lançamento** | **15/12** |

O lançamento fica em 15/12, duas semanas antes das edições anteriores (28/12 e 30/12).

## Decisões

- [x] **Barreira de contribuição:** liberado para todos, sem fila nem contribuição.
- [x] **Link público:** não entra em 2026.
- [x] **Selo e resumo da comunidade:** entram em 2026.
- [x] **Data de lançamento:** 15/12.
- [x] **Corte final (decidido em 18/11):** entram só os dados que chegaram até 06/12/2026. O script em lote pode rodar a partir de 07/12 e gera os dados finais dos dois capítulos.
- [x] **Números abreviados:** k, m, bi e tri em PT (984k, 1,1m, 28 bi) e k, m, b e t em EN, no lugar de "mil", "mi" e "bi" do formato compacto padrão.

Os protótipos e a demo já foram feitos (seção Status).

## Capítulos

Decidido em 18/11/2026.

| Capítulo | Quem vê | Conteúdo |
| --- | --- | --- |
| 1. Neopia em 2026 | Todo mundo, inclusive deslogados (que terminam com convite para fazer login) | Números do ano, rankings, inflação por categoria e quiz |
| 2. Restock | Quem tem `RestockSession` no ano | Os 11 slides da etapa 1 |

O capítulo **Pessoal** foi descartado de vez, inclusive como encarte dentro do Geral. O itemdb não registra comportamento por pessoa (itens vistos, buscas), e o que existe por conta (listas, contribuição, data de criação) não sustenta slides interessantes. Se for preciso em 2027, o caminho é começar a registrar eventos por conta antes.

### Inflação por categoria

Consultas só de leitura em 18/11/2026. As cestas são as checklists oficiais: Book Award (lista 664), Booktastic Book Award (663), Gourmet Food (72), listas com `official_tag` Stamps e Quest Log, só itens NP. O preço inicial é a mediana dos preços confirmados de dez/2025 a jan/2026, e o final é a mediana de set a nov/2026. Entram só itens que valiam a partir de 1.000 NP no início; abaixo disso o preço oscila entre 1 e 600 NP e distorce as porcentagens.

| Categoria | Item típico (mediana) | Itens de 1 mi NP+ | Custo da checklist completa |
| --- | --- | --- | --- |
| Book Award | +3,8% | −2,5% | −48,6% |
| Booktastic | −15,6% | −30,6% | −81,3% |
| Gourmet Food | −13,1% | −38,0% | −65,9% |
| Selos | −17,4% | −34,0% | −48,4% (28,8 bi → 14,6 bi NP) |
| Quest Log | −33,8% | −71,7% | −64,2% |

- **Itens caros caíram, baratos ficaram estáveis.** Na faixa de 1 a 10 mil NP a variação ficou entre −16% e +3%.
- **Quest log:** 516 prêmios de 100 mil NP ou mais perderam mais de 90% do valor, com picos em março (88), maio (86), julho (84) e setembro (87).
- **Corrida dos livros:** em 02/11/2026 o Neopets passou a dar mais prêmios pela leitura. Entre 06/11 e 13/11, mais de 900 livros passaram a valer mais de 5× o preço de outubro (Muffin Baking Book de 3,7 mil para 650 mil). O volume diário de atualizações de preço ficou normal, então não é erro de processamento. No lote, o preço final deve ser o de 06/12 (corte final), e não a mediana de set a nov.

### Leilões

Consultas de 18/11/2026, de 01/01 a 13/11. Contam como vendidos os leilões com comprador (`otherInfo` sem `nobody`) e com `Closed` ou `< 30 min`. O preço é o último lance que o itemdb viu, então para os leilões em `< 30 min` o valor é um piso.

| Dado | Valor |
| --- | --- |
| Leilões vistos (`RestockAuctionHistory`, `type = 'auction'`) | 984.168 |
| Leilões vendidos | 291.466, de 19.967 itens |
| NP movimentado nos vendidos | 9,12 trilhões |
| Mais NP movimentado | Seasonal Attack Pea (218,6 bi em 3.580 leilões), Coffee and Marshmallows (188,3 bi), Cool Negg (173,8 bi em 29.903 leilões) |
| Leilões no teto de 2.147.483.647 NP | 6: Mystery Island Kiko Stamp, Eraser of the Dark Faerie, Super Attack Pea (2), Fashionista Stamp, Commander Garoo Stamp |

### Álbum de selos e efeito quest log

- **Álbum:** é a lista oficial "All Collectibles" (9882), com 984 itens de todas as páginas. A conta usa o preço vigente em 01/01 (o último confirmado antes de 2026) e o preço atual, só para os 903 itens que tinham preço nas duas datas: de 51,4 bi para 28,0 bi NP (−45%). 7 itens não têm nenhum preço, entre eles o Fashionista Stamp, que foi vendido em leilão por 2,1 bi.
- **Quest log:** os pools de 2026 começaram em 05/01, 02/03, 04/05, 06/07 e 07/09, os mesmos meses dos picos de quedas. Para os 687 itens desses 5 pools (só listas "Pool", com `seriesStart`/`seriesEnd`), a mediana do preço nas últimas 3 semanas do pool, comparada com o mês anterior ao pool, caiu 98,6%. 547 itens perderam mais de 90%, e só 4 não caíram.

### Quiz

Para tirar ruído, o início é o maior dos 3 primeiros preços de dez a jan e o fim é o menor dos 3 últimos de set a nov (o contrário para quedas), com pelo menos 5 atualizações em 2026.

| Pergunta | Resposta | Alternativas |
| --- | --- | --- |
| Qual item mais ganhou NP? | Day and Night Collectable Scarab (20,6 mi → 135 mi) | Bank Manager Stamp, Wise Gnorbu Stamp, Toothygrin |
| Qual item mais perdeu NP? | The Darkest Faerie Stamp (600 mi → 3,35 mi) | Igneot Stamp, Jorett Stamp, Faerie Slingshot |

O Korbat Night Sky subiu mais (+155 mi), mas tem só 7 atualizações no ano. Vários preços de alta param logo abaixo de 999.999 NP, o teto da Shop Wizard, então o valor real pode ser maior.

As duas perguntas ficam no quiz de personalidade como **bônus**: mostram a resposta e a variação em % ("mais subiu de preço", +555% para o Day and Night Collectable Scarab), mas não contam para o resultado.

### Quiz de personalidade

Decidido em 18/11/2026; perguntas e dados dos tipos fechados em 20/11/2026 e já na demo. O capítulo Geral virou um quiz no estilo Buzzfeed: perguntas pessoais e meio bobinhas, e no fim a pessoa recebe um tipo de Neopiano. O tipo substitui o placar de acertos, e o story compartilhável passa a ser "Meu tipo de Neopiano em 2026".

**Como encaixa:** cada pergunta pessoal entra logo antes do slide de dados do mesmo tema. As perguntas de trivia sobre item mais visto, caixa mais aberta, leilões e Muffin Baking Book saíram; os dados delas continuam nos slides de ranking. Maior alta e maior queda ficaram como bônus, sem pontuação, com a chamada "Você sabe mesmo o que rolou em 2026?".

**Tipos**

São 4 tipos, e cada pergunta tem uma opção para cada tipo, então todos somam 7 pontos. O Restocker saiu do capítulo Geral porque o capítulo 2 já revela o tipo de restocker. O Apostador do Caos foi trocado pela Fashionista.

| Tipo | Quem é |
| --- | --- |
| Especulador | Quer lucrar do jeito que a comunidade respeita: restock e vender os itens caros que encontra no cofre. Não é quem compra tudo o que está à venda para revender mais caro, o que a comunidade condena. |
| Colecionador | Quer completar a coleção: álbum de selos e checklists. |
| Fashionista | Itens NC como customização: deixar o pet bonito e estiloso. Styling Studio, Dyeworks, valor Lebron e histórico de trocas. |
| Neopiano Raiz | Gosta de jogar e se dedica, sem tryhardar: diários, quest log, banco rendendo juros. |

**Dado do ano de cada tipo**

Fechados em 20/11, com dados até 20/11 (consultas só de leitura). Nenhum repete o que já aparece nos stories. "Itens novos" segue a regra do "Descoberto em" da página do item (`mapFirstSeen` em `app/server/items/v2.ts`): `item_id` ≥ 85020, sem PB e `addedAt` no ano.

| Tipo | Dado |
| --- | --- |
| Especulador | O Love Bomb, que vale 290m NP, foi visto restocando 13 vezes pelo itemdb em 2026. Conta só o que usuários do itemdb viram; ele pode ter aparecido mais vezes. |
| Colecionador | 73 itens novos entraram no álbum de selos em 2026 (lista "All Collectibles"). |
| Fashionista | 4.365 itens NC novos em 2026, sendo 1.713 wearables e 2.048 Pet Styles. |
| Neopiano Raiz | 1.268 itens NP novos em 2026, sendo 828 r101 e 10 no trade. |

Também foram descartados: listas oficiais criadas no ano, avatares novos (a tabela do itemdb só tem avatares de itens) e livros novos.

**Perguntas** (na ordem em que aparecem; a opção de cada tipo entre colchetes)

1. **Você tem uma hora livre para jogar Neopets. O que faz?** (antes de "Neopia não parou")
    - Uma sessão de restock [Especulador]
    - Caça os itens que faltam para completar a sua coleção [Colecionador]
    - Confere os tópicos de troca NC nos fóruns [Fashionista]
    - Corre para fazer os diários [Raiz]
2. **Chegou uma proposta de troca para você. Você…** (antes dos NC mais trocados)
    - Confere no itemdb se o negócio vale a pena [Especulador]
    - Só aceita se vier aquele item que falta na coleção [Colecionador]
    - Confere o valor Lebron e o histórico de trocas antes de responder [Fashionista]
    - Aceita se for bom para os dois lados [Raiz]
3. **Seu item dos sonhos apareceu para negociar. Você…** (antes dos leilões)
    - Vê o que tem de valor no cofre para oferecer em troca [Especulador]
    - É a peça que falta para completar a sua coleção: é agora ou nunca [Colecionador]
    - Corre para a Trade List e torce para ter algo para trocar [Fashionista]
    - Já tem o NP guardado para oferecer em pure [Raiz]
4. **Você acabou de ganhar 100m NP. Você…** (antes da inflação)
    - Tenta descolar algo valioso nos leilões [Especulador]
    - Gasta tudo naquele selo que falta no álbum [Colecionador]
    - Compra um petpet caro que combine com o seu pet [Fashionista]
    - Bota no banco para render juros [Raiz]
5. **Como está o seu SDB?** (antes do álbum de selos)
    - Toda vez que você abre, acha algo que dá para vender bem [Especulador]
    - Selos guardados, porque ainda não teve coragem de colar [Colecionador]
    - Várias GBCs e itens esperando a troca certa [Fashionista]
    - Milhares de itens que você jura que vai organizar um dia [Raiz]
6. **A pool do quest log acabou de mudar. Você…** (antes do efeito quest log)
    - Corre para vender o que tem antes que desvalorize [Especulador]
    - Torce para vir um selo para a sua coleção nessa pool [Colecionador]
    - Torce para vir pincéis ou petpets que combinem com o seu pet [Fashionista]
    - Dá reroll no prêmio até vir algo valioso da nova pool para completar seu streak [Raiz]
7. **Os livros ganharam prêmios, troféus e avatares, e chegou a Pet Bookshelf. Você…** (antes da corrida dos livros)
    - Foi ver se tinha algum livro no cofre que agora vale uma fortuna [Especulador]
    - Foi atrás dos livros que faltavam na checklist do Book Award [Colecionador]
    - Foi direto personalizar a Pet Bookshelf [Fashionista]
    - Seu pet já tinha lido a maior parte, e os avatares vieram sem esforço [Raiz]

Na tela, a ordem das opções muda de pergunta para pergunta, e a resposta pode ser trocada até o fim.

**Regras**

- **Desempate:** vence o tipo escolhido na última pergunta respondida entre os empatados.
- **Pulou alguma pergunta:** resultado genérico ("Neopiano de 2026"), sem tipo, também no story.

**Ainda em revisão** (na demo como rascunho)

- Texto da abertura (placeholder: "Responda com sinceridade: no fim, a gente diz que tipo de Neopiano você foi").
- Descrição e piada de cada tipo, e o texto do resultado genérico.
- Símbolos dos tipos: Love Bomb, Oscar Stamp e Sunset Journal (itens novos em mais listas de pessoas diferentes) e Styling Studio Supplies, que não é novo.
- Nomes em EN: Speculator, Collector, Fashionista, Old-School Neopian.

## Ampliação do escopo (análise de 13/11)

Atualizado em 13/11/2026. A ideia era que o Review 2026 também atendesse quem usa o itemdb sem o restock dashboard e quem visita deslogado, com estatísticas e curiosidades sobre itens, preços e listas. As decisões estão na seção Capítulos; a análise abaixo fica como registro.

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
- Páginas de item mais vistas (o Umami registra quase tudo em `/item/` sem prefixo de idioma; `/pt/item/` tem 1 visita, então não falta somar nada): Hungry Fungus (6.798), ARGH!!!! DONNA STAMP (5.686), Cool Negg (4.635), Drakaras Wand (4.119), Corrupted Staff of the Void (3.472).
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
