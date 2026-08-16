import type { ItemData } from '@types';
import { needsLebronTradeHistory, needsNPPrices } from '@app/_components/Item/itemPageGates';

export type ItemMetaDescriptionOptions = {
  /** Same condition as `ItemDropsSection`: openable meta with at least one accepted drop. */
  hasDropsCard?: boolean;
};

type ItemDbLocale = 'en' | 'pt';

/** SERP meta description cap. The item name is never truncated, so a very long name can still exceed this. */
export const ITEM_META_DESCRIPTION_MAX = 155;

/** Official TNT text used for og:description / twitter:description (unchanged from the old item meta). */
export const ITEM_OG_DESCRIPTION_MAX = 130;

/** Flavor shorter than this is dropped — a clipped preposition is worse than no B block. */
const MIN_FLAVOR_LENGTH = 20;

/** Marks a flavor that was cut mid-sentence. Same form as the OG truncation. */
const ELLIPSIS = '...';

/** True when the string already ends a sentence, including `"eat me!"`. */
const TERMINATED = /[.!?]["'“”‘’)\]]*$/;

/** Sentence break: terminator, optional closer, space, capital. Skips "2.5 million". */
const SENTENCE_BOUNDARY = /(?<=[.!?]["'“”‘’)\]]?)\s+(?=["'“‘(]*[A-Z0-9])/;

/** Tokens that end in "." mid-sentence, so the split must be undone ("Dr. Sloth"). */
const ABBREVIATIONS = new Set([
  'dr',
  'mr',
  'mrs',
  'ms',
  'st',
  'jr',
  'sr',
  'vs',
  'etc',
  'approx',
  'eg',
  'ie',
]);

/** Drop these if they would be the last word after a flavor cut ("Turn your Neopet into"). */
const TRAILING_FUNCTION_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'nor',
  'of',
  'to',
  'for',
  'in',
  'on',
  'at',
  'by',
  'with',
  'from',
  'as',
  'into',
  'onto',
  'upon',
  'your',
  'its',
  'this',
  'that',
]);

type MetaCopy = {
  see: string;
  for: string;
  onItemdb: string;
  and: string;
  updatedPrices: string;
  ncValue: string;
  lebronNcValue: string;
  auctionHistory: string;
  ncTradeHistory: string;
  trades: string;
  restockInfo: string;
  dropsAndOdds: string;
  itemPreview: string;
};

const COPY: Record<ItemDbLocale, MetaCopy> = {
  en: {
    see: 'See',
    for: 'for',
    onItemdb: 'on itemdb',
    and: 'and',
    updatedPrices: 'updated prices',
    ncValue: 'NC value',
    lebronNcValue: 'Lebron NC value',
    auctionHistory: 'auction history',
    ncTradeHistory: 'NC trade history',
    trades: 'trades',
    restockInfo: 'restock info',
    dropsAndOdds: 'odds and drops',
    itemPreview: 'item preview',
  },
  pt: {
    see: 'Veja',
    for: 'de',
    onItemdb: 'no itemdb',
    and: 'e',
    updatedPrices: 'preços atualizados',
    ncValue: 'valor NC',
    lebronNcValue: 'valor Lebron',
    auctionHistory: 'histórico de leilões',
    ncTradeHistory: 'histórico de trocas NC',
    trades: 'trocas',
    restockInfo: 'restock info',
    dropsAndOdds: 'chances e drops',
    itemPreview: 'item preview',
  },
};

/** One page section. `labels` is longest-first (e.g. "Lebron NC value" then "NC value"). */
type SlotCandidate = {
  labels: string[];
};

/** OG/Twitter keep the official TNT blurb; SERP uses B+D instead. */
export function truncateItemOgDescription(description: string) {
  if (!description) return description;
  if (description.length <= ITEM_OG_DESCRIPTION_MAX) return description;
  return description.slice(0, ITEM_OG_DESCRIPTION_MAX) + '...';
}

/**
 * SERP description: optional TNT flavor (B) + "See {slots} for {name} on itemdb." (D).
 * EN and PT both attach flavor. D is packed first; B uses whatever characters remain.
 */
export function buildItemMetaDescription(
  item: ItemData,
  locale: string,
  options: ItemMetaDescriptionOptions = {}
) {
  const normalizedLocale: ItemDbLocale = locale === 'pt' ? 'pt' : 'en';
  const copy = COPY[normalizedLocale];
  const slots = collectSlots(item, copy, options);
  const phrases = packSlots(slots, item.name, copy, ITEM_META_DESCRIPTION_MAX);
  const d = composeD(phrases, item.name, copy);

  return attachFlavor(item.description, d);
}

/**
 * Fit B into whatever is left after D. Uncut flavor is tried first (no ellipsis
 * reserved). Only a mid-sentence cut pays for `...`.
 */
function attachFlavor(raw: string, d: string) {
  const remaining = ITEM_META_DESCRIPTION_MAX - d.length - 1;
  if (remaining < 1) return d;

  const text = raw?.trim() ?? '';
  if (!text) return d;

  const uncutExtra = isTerminated(text) ? 0 : 1;
  if (text.length + uncutExtra <= remaining) {
    return `${closeFlavor(text, false)} ${d}`;
  }

  let flavor = fitFlavor(text, remaining);
  if (!flavor) return d;
  // A cut that lands on "Dr." is still a fragment, even though it ends in ".".
  if (isFinishedSentence(flavor)) return `${flavor} ${d}`;

  if (flavor.length + ELLIPSIS.length <= remaining) {
    return `${flavor}${ELLIPSIS} ${d}`;
  }

  flavor = fitFlavor(text, remaining - ELLIPSIS.length);
  if (!flavor) return d;
  if (isFinishedSentence(flavor)) return `${flavor} ${d}`;
  return `${flavor}${ELLIPSIS} ${d}`;
}

function isTerminated(text: string) {
  return TERMINATED.test(text);
}

/** Real sentence end, not an abbreviation period ("Dr." / "etc."). */
function isFinishedSentence(text: string) {
  return isTerminated(text) && !endsWithAbbreviation(text);
}

/**
 * Without a terminator the flavor runs into D ("…can play See updated prices").
 * A cut gets an ellipsis; a whole description that simply lacks a period gets one.
 */
function closeFlavor(flavor: string, wasCut: boolean) {
  if (isTerminated(flavor)) return flavor;
  return wasCut ? `${flavor}${ELLIPSIS}` : `${flavor}.`;
}

/**
 * Additive flags, highest priority first. NP / NC / wearable / restock can all apply.
 * 1. updated prices | NC value (Lebron label when sourced from Lebron)
 * 2. auction history (any active NP) | NC trade history
 * 3. trades (NP; can sit next to auction)
 * 4. restock info
 * 5. odds and drops (drops card actually rendered)
 * 6. item preview
 */
function collectSlots(
  item: ItemData,
  copy: MetaCopy,
  options: ItemMetaDescriptionOptions
): SlotCandidate[] {
  const slots: SlotCandidate[] = [];
  const isActive = item.status === 'active';

  // 1. Price — skip no-trade / unknown-zero. NC value is promised for any active NC item.
  if (needsNPPrices(item) && item.price.value) {
    slots.push({ labels: [copy.updatedPrices] });
  }

  if (item.isNC && isActive) {
    if (item.ncValue?.source === 'lebron') {
      slots.push({ labels: [copy.lebronNcValue, copy.ncValue] });
    } else {
      slots.push({ labels: [copy.ncValue] });
    }
  }

  // 2. Auction for every active NP item / NC trades.
  if (!item.isNC && isActive) {
    slots.push({ labels: [copy.auctionHistory] });
  }

  if (needsLebronTradeHistory(item)) {
    slots.push({ labels: [copy.ncTradeHistory] });
  }

  // 3. NP trade lists / wishlists — not XOR with auction.
  if (!item.isNC && item.status === 'active') {
    slots.push({ labels: [copy.trades] });
  }

  // 4. Same gate as the restock card on the item page (`findAt.restockShop`).
  if (item.findAt?.restockShop) {
    slots.push({ labels: [copy.restockInfo] });
  }

  // 5. Only when the drops card actually renders (not just `canOpen`).
  if (options.hasDropsCard) {
    slots.push({ labels: [copy.dropsAndOdds] });
  }

  // 6. Wearable preview — first to drop when the string is too long.
  if (item.isWearable) {
    slots.push({ labels: [copy.itemPreview] });
  }

  return slots;
}

/**
 * Include slots in priority order. If the next one does not fit, stop —
 * do not skip it to squeeze in a lower-priority slot.
 * For Lebron, try the longer label first, then fall back to "NC value".
 */
function packSlots(slots: SlotCandidate[], name: string, copy: MetaCopy, max: number) {
  const included: string[] = [];

  for (const slot of slots) {
    const chosen = slot.labels.find(
      (label) => composeD([...included, label], name, copy).length <= max
    );
    if (!chosen) break;
    included.push(chosen);
  }

  return included;
}

/** "See updated prices, trades and restock info for Green Apple on itemdb." */
function composeD(phrases: string[], name: string, copy: MetaCopy) {
  if (phrases.length === 0) {
    return `${copy.see} ${name} ${copy.onItemdb}.`;
  }

  return `${copy.see} ${joinPhrases(phrases, copy.and)} ${copy.for} ${name} ${copy.onItemdb}.`;
}

/** No Oxford comma: "a, b and c". */
function joinPhrases(phrases: string[], andWord: string) {
  if (phrases.length === 1) return phrases[0];
  if (phrases.length === 2) return `${phrases[0]} ${andWord} ${phrases[1]}`;
  return `${phrases.slice(0, -1).join(', ')} ${andWord} ${phrases[phrases.length - 1]}`;
}

/**
 * Trim the official TNT text from the start (do not pick the "funniest" sentence).
 * Whole text → whole sentences → clause → last word boundary, never mid-word.
 * The caller adds the terminator or ellipsis, so the result stays within `budget`.
 */
export function fitFlavor(raw: string, budget: number) {
  if (budget < 1) return '';

  const text = raw?.trim() ?? '';
  if (!text) return '';
  // A complete description is kept even when it is shorter than MIN_FLAVOR_LENGTH ("A hat.").
  if (text.length <= budget) return text;
  if (budget < MIN_FLAVOR_LENGTH) return '';

  const sentences = splitSentences(text);
  let acc = '';

  for (const sentence of sentences) {
    const next = acc ? `${acc} ${sentence}` : sentence;
    if (next.length <= budget) {
      acc = next;
      continue;
    }

    // First sentence already overflows: cut it. Otherwise keep what fit and stop.
    if (!acc) {
      acc = fitClause(sentence, budget);
    }
    break;
  }

  // An abbreviation outside the list can still leave a stub ("A Kau."): cut the raw text instead.
  if (acc.length < MIN_FLAVOR_LENGTH) {
    acc = fitClause(text, budget);
  }

  return finalizeFlavor(acc, text, budget);
}

function splitSentences(text: string) {
  const sentences: string[] = [];

  for (const part of text.split(SENTENCE_BOUNDARY)) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (sentences.length > 0 && endsWithAbbreviation(sentences[sentences.length - 1])) {
      sentences[sentences.length - 1] += ` ${trimmed}`;
      continue;
    }

    sentences.push(trimmed);
  }

  return sentences.length > 0 ? sentences : [text];
}

function endsWithAbbreviation(sentence: string) {
  const lastToken = sentence.split(/\s+/).pop() ?? '';
  if (!lastToken.endsWith('.')) return false;

  const word = lastToken
    .slice(0, -1)
    .replace(/[^a-zA-Z]/g, '')
    .toLowerCase();
  return ABBREVIATIONS.has(word);
}

/** Cut on ", ; : — -" before falling back to a word boundary. */
function fitClause(sentence: string, budget: number) {
  if (sentence.length <= budget) return sentence;

  const parts = sentence.split(/, |; |: | — | – | - /);
  if (parts.length === 1) return fitWords(sentence, budget);

  let acc = '';
  let searchFrom = 0;

  for (const part of parts) {
    const partIndex = sentence.indexOf(part, searchFrom);
    if (partIndex < 0) break;

    // Slice from the original so commas/dashes stay attached to the kept clause.
    const next = sentence.slice(0, partIndex + part.length);
    if (next.length <= budget) {
      acc = next;
      searchFrom = partIndex + part.length;
      continue;
    }

    if (!acc) return fitWords(part, budget);
    break;
  }

  return acc.trimEnd();
}

function fitWords(text: string, budget: number) {
  if (text.length <= budget) return text;

  const lastSpace = text.lastIndexOf(' ', budget);
  if (lastSpace < 1) return '';

  return text.slice(0, lastSpace).trimEnd();
}

function finalizeFlavor(candidate: string, original: string, budget: number) {
  const trimmed = candidate.trimEnd();

  // A whole sentence keeps its last word: "…to play with." was not cut, so "with" is no orphan.
  let flavor = isTerminated(trimmed) ? trimmed : stripOrphanWords(trimmed);
  flavor = restoreSentencePunctuation(flavor, original, budget);

  return flavor.length >= MIN_FLAVOR_LENGTH ? flavor : '';
}

function stripOrphanWords(text: string) {
  const words = text.split(/\s+/).filter(Boolean);

  while (words.length > 0) {
    const last = words[words.length - 1].replace(/[^a-zA-Z]+/g, '').toLowerCase();
    if (!last || !TRAILING_FUNCTION_WORDS.has(last)) break;
    words.pop();
  }

  return words.join(' ').replace(/[,;:\s]+$/g, '');
}

/** Put back ".?!" if the cut landed right before the original terminator ("baby" → "baby!"). */
function restoreSentencePunctuation(truncated: string, original: string, budget: number) {
  if (!truncated || isTerminated(truncated)) return truncated;

  const idx = original.indexOf(truncated);
  if (idx < 0) return truncated;

  const next = original[idx + truncated.length];
  if (next && '.!?'.includes(next) && truncated.length + 1 <= budget) {
    return truncated + next;
  }

  return truncated;
}
