// Reads a Trading Post wishlist the way the trade pricing guidelines do and returns the
// price each lot slot should get (null = leave blank), or abstains when the wishlist is
// ambiguous. Pure: item names the wishlist may mention are passed in by the caller.

const UNIT: Record<string, number> = {
  k: 1e3,
  m: 1e6,
  mil: 1e6,
  mils: 1e6,
  mill: 1e6,
  mills: 1e6,
  million: 1e6,
  millions: 1e6,
  millon: 1e6,
  mio: 1e6,
  mm: 1e6,
  b: 1e9,
  bn: 1e9,
  bil: 1e9,
  billion: 1e9,
};
const UNIT_RE = 'k|millions|million|millon|mills|mill|mils|mil|mio|mm|m|billion|bil|bn|b';

// payment items and generic "something else" words; specific items come from knownItemNames
const ITEM_WORDS =
  /c\s*o?\s*o?l?\s*neggs?\b|\bs(uper\s*)?neggs?\b|\bneggs?\b|\bpbs?\b|paint\s*brush(es)?|\bcns?\b|\bbpbs?\b|\bets\b|\bhts\b|\bbaby\b|\bsomething\b|\bitems?\b|\bstuff\b|\bstamps?\b|\bplush(ie|y)s?\b|\bpotions?\b|\bmorph(ing)?s?\b|\bcodestones?\b|\bbooks?\b|\bpeas?\b|\bsaps?\b|\bcollectables?\b|\bdubloons?\b|\bpetpets?\b|\bnerkmids?\b|\bgoodie bags?\b|\bwearables?\b|\bfilters?\b|\bcharms?\b/i;

const MAX_NAME_WORDS = 6;
const MAX_NAME_TOKENS = 80;

export type WishlistLotItem = {
  item_iid?: number | null;
  name?: string | null;
  amount?: number | null;
};

export type WishlistPrices = { prices: (number | null)[]; reason: string } | { abstain: string };

const tokenize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9' -]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

/** Word sequences of the wishlist that could be an item name (to look up in Items). */
export const getWishlistNameCandidates = (wishlist: string) => {
  const tokens = tokenize(wishlist).slice(0, MAX_NAME_TOKENS);
  const out = new Set<string>();
  for (let n = 1; n <= MAX_NAME_WORDS; n++)
    for (let i = 0; i + n <= tokens.length; i++) {
      const gram = tokens.slice(i, i + n).join(' ');
      if (gram.length >= 4 && /[a-z]/.test(gram)) out.add(gram);
    }
  return [...out];
};

const normalize = (wishlist: string) => {
  let l = ' ' + wishlist.toLowerCase().replace(/[ \t\r]+/g, ' ') + ' ';
  l = l.replace(/https?:\/\/\S+|\S+\.(com|net|org)\/\S*/g, ' '); // links carry ids
  l = l.replace(/(\d)\s*(,|\.)\s*o{3}/g, '$1$2000'); // 135,ooo,ooo
  l = l.replace(/~?\s*-?ish\b/g, ''); // 60~ish mil
  l = l.replace(new RegExp(`(\\d),(\\d{1,2})(?!\\d)\\s*(?=(${UNIT_RE})\\b)`, 'g'), '$1.$2'); // 6,5m
  l = l.replace(/\b(\d{1,3})((?:\.\d{3}){2,})(?!\d)/g, (_, a, b) => a + b.replaceAll('.', ''));
  while (/\d,\d{3}(?!\d)/.test(l)) l = l.replace(/(\d),(\d{3})(?!\d)/, '$1$2');
  l = l.replace(/(\d+)\s*m\s*(\d{3})\s*k\b/g, (_, a, b) => `${Number(a) * 1000 + Number(b)}k`); // 1m800k
  // ranges take the lowest value: "25-30 mil", "100-120m"
  l = l.replace(
    new RegExp(
      `(\\d+(?:\\.\\d+)?)\\s*(${UNIT_RE})?\\s*(?:-|~|to)\\s*(\\d+(?:\\.\\d+)?)\\s*(${UNIT_RE})\\b`,
      'g'
    ),
    (_, a, u1, _b, u2) => `${a}${u1 ?? u2}`
  );
  return l;
};

// digits glued to letters are usernames or codes (boasurfer3008); bare numbers under 1000
// without a unit are ambiguous (pt-2)
const AMOUNT_RE = new RegExp(
  `(?<![a-z\\d_.,#])(\\d+(?:\\.\\d+)?)\\s*(?:(${UNIT_RE})(?![a-z])|(nps?|neopoints)(?![a-z])|(?![a-z\\d.]))`,
  'g'
);

const amounts = (l: string) => {
  const out: number[] = [];
  for (const m of l.matchAll(AMOUNT_RE)) {
    const n = parseFloat(m[1]);
    let v: number | null = null;
    if (m[2]) v = Math.round(n * UNIT[m[2]]);
    else if (m[3] || n >= 1000) v = Math.round(n);
    if (v != null && v >= 1) out.push(v);
  }
  return out;
};

const AMT = `\\d[\\d.,]*\\s*(?:${UNIT_RE})?\\s*(?:nps?|neopoints)?`;
// "700k lower than lowest", "5% below tp", "lowest on tp by 500k"
const RELATIVE_PHRASE = new RegExp(
  `${AMT}\\s*(?:lower|less|cheaper|below|under|off)\\b(?:\\s*than)?(?:\\s*the)?\\s*(?:lowest|tp|trading post|ssw|sw|jn|itemdb|market)?|` +
    `(?:lowest|cheapest|under(?:cut)?)\\b[^.\\d]{0,25}\\bby\\s*${AMT}|\\d+(?:\\.\\d+)?\\s*%[^.\\d]*`,
  'g'
);
const NEGATION = /\b(not|don'?t|do not|isn'?t|never|won'?t)\b[^.!?\d]{0,40}\d/;
const CONNECTOR = /\s*(?:\+|\bplus\b|\band\b|&|\bw\/)\s*/;
const ALTERNATIVE =
  /\bor\b|\/(?!\s*ea)|;|\||\n|\botherwise\b|\bif you(?:'d| would)? (?:prefer|rather)\b|\bwill (?:take|accept|do)\b|\bcan (?:take|do)\b/;
const EACH = /\bea(ch)?\b|\/ ?ea\b|\bper\b|\bapiece\b|\bchac?un\b|\bchaqu'?un\b|\bcada\b|\bcu\b/;
const PURE_AMOUNT = new RegExp(`\\d+(\\.\\d+)?\\s*(${UNIT_RE})?\\s*(nps?\\s*)?pure`, 'g');

type Option = { value: number | null | 'ambiguous'; pure: boolean };

const createItemMatcher = (knownItemNames: Set<string>) => (s: string) => {
  if (ITEM_WORDS.test(s)) return true;
  const tokens = tokenize(s);
  for (let n = 1; n <= MAX_NAME_WORDS; n++)
    for (let i = 0; i + n <= tokens.length; i++)
      if (knownItemNames.has(tokens.slice(i, i + n).join(' '))) return true;
  return false;
};

// one alternative of the wishlist ("20m + 2 cool neggs", "[38m] - 20m + 3 cn", ...)
const evalOption = (o: string, mentionsItem: (s: string) => boolean): Option | null => {
  const amts = amounts(o);
  const pure = /\bpure\b/.test(o);
  if (!amts.length) return mentionsItem(o) ? { value: null, pure } : null;

  // brackets: "[38m] - 20m + 3 cn" is the total; "invis pb (3mil)" is that item's value
  for (const b of o.matchAll(/[[(]([^\])]*)[\])]/g)) {
    const inner = b[1];
    const innerAmts = amounts(` ${inner} `);
    const outAmts = amounts(o.slice(0, b.index) + ' ' + o.slice(b.index + b[0].length));
    // "25m (20m + 1 cool negg)": breakdown of the outside total
    if (CONNECTOR.test(inner) && mentionsItem(inner) && outAmts.length === 1)
      return { value: outAmts[0], pure };
    if (innerAmts.length !== 1) continue;
    const others = outAmts.reduce((s, a) => s + a, 0);
    const afterItem = mentionsItem(o.slice(Math.max(0, b.index - 30), b.index));
    if (!afterItem && innerAmts[0] >= others) return { value: innerAmts[0], pure };
    if (afterItem && innerAmts[0] < others) return { value: others + innerAmts[0], pure };
    if (afterItem) return { value: 'ambiguous', pure };
  }

  // "80m in pure and cool negg": the amount is the total of a mixed payment
  const free = o.replace(PURE_AMOUNT, 'N');
  if ((/\bpure\b/.test(free) || /\bmix\b/.test(free)) && mentionsItem(free) && amts.length === 1)
    return { value: amts[0], pure };

  // sum the parts (declared item values count, pt-9 blanks an item without value)
  let sum = 0;
  for (const part of o.split(CONNECTOR)) {
    const values = [...new Set(amounts(` ${part} `))];
    if (values.length > 1) return { value: 'ambiguous', pure };
    if (values.length) sum += values[0];
    else {
      const head = part.split(/[.!?\n]/)[0];
      if (head.trim().split(/\s+/).length <= 7 && mentionsItem(head)) return { value: null, pure };
    }
  }
  return { value: sum, pure };
};

const mapListToItems = (
  bars: string[],
  items: WishlistLotItem[],
  mentionsItem: (s: string) => boolean
): WishlistPrices => {
  const words = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .split(/[^a-z]+/)
        .filter((x) => x.length >= 4)
    );
  const unitWords = new RegExp(`\\b(${UNIT_RE}|nps?|pure|each)\\b`, 'g');

  // -1: the part names something but no single lot item; null: the part has no names
  const target = bars.map((bar) => {
    const marker = bar.match(/lotitem(\d+)/);
    if (marker) return Number(marker[1]);
    const barWords = words(bar.replace(unitWords, ''));
    const hits = items
      .map((it, i) => (it.name && [...words(it.name)].some((x) => barWords.has(x)) ? i : -1))
      .filter((i) => i >= 0);
    if (hits.length === 1) return hits[0];
    return barWords.size ? -1 : null;
  });

  const byName = target.every((t) => t != null && t >= 0) && new Set(target).size === items.length;
  const bySlot = target.every((t) => t === null);
  if (!byName && !bySlot) return { abstain: 'list without a match' };

  const prices = items.map(() => null as number | null);
  bars.forEach((bar, k) => {
    const i = byName ? (target[k] as number) : k;
    const value = evalOption(bar.replace(/lotitem\d+/, ''), mentionsItem)?.value;
    prices[i] = typeof value === 'number' ? Math.round(value / (items[i].amount || 1)) : null;
  });

  return { prices, reason: byName ? 'list by item' : 'list by slot' };
};

/**
 * Expected price per lot slot (unit price, null = blank) according to the guidelines.
 * `knownItemNames`: lowercase names of tradeable items the wishlist mentions.
 */
export const getWishlistPrices = (
  wishlist: string,
  items: WishlistLotItem[],
  instantBuy: number | null | undefined,
  knownItemNames: Set<string>
): WishlistPrices => {
  if (instantBuy) return { abstain: 'instant buy' };
  if (!items.length) return { abstain: 'no items' };

  const mentionsItem = createItemMatcher(knownItemNames);
  const blank = (reason: string): WishlistPrices => ({ prices: items.map(() => null), reason });

  let l = normalize(wishlist);
  // the lot's own items are not payment ("Baby Aisha Goodie Bag 250m")
  items.forEach((it, i) => {
    if (it.name) l = l.split(it.name.toLowerCase()).join(` lotitem${i} `);
  });

  if (!amounts(l).length) return blank('no np value');
  l = l.replace(RELATIVE_PHRASE, ' ');
  if (!amounts(l).length) return blank('relative price');
  if (NEGATION.test(l)) return { abstain: 'negation' };

  // pt-14: "10m | 5m | nm | 10m"
  const bars = l.split('|');
  if (items.length > 1 && bars.length === items.length)
    return mapListToItems(bars, items, mentionsItem);

  const options = l
    .split(ALTERNATIVE)
    .map((o) => evalOption(o, mentionsItem))
    .filter((o): o is Option => !!o);

  const hasPureValue = options.some((o) => o.pure && typeof o.value === 'number');
  if (options.some((o) => o.value === 'ambiguous') && !hasPureValue)
    return { abstain: 'multiple values' };

  const valued = options.filter(
    (o): o is Option & { value: number } => typeof o.value === 'number'
  );
  if (!valued.length) return blank('item payment without np value');

  let value: number;
  const distinct = [...new Set(valued.map((o) => o.value))];
  if (distinct.length === 1) value = distinct[0];
  else {
    const pureValues = [...new Set(valued.filter((o) => o.pure).map((o) => o.value))];
    if (pureValues.length !== 1) return { abstain: 'multiple values' };
    value = pureValues[0];
  }

  if (value < 50) return blank('symbolic');

  const allEqual = items.every((i) => i.item_iid === items[0].item_iid);
  if (items.length > 1 && !allEqual) return { abstain: 'mixed lot' };

  // pt-17: identical items share one total unless the price is per unit
  const qty = items.reduce((s, i) => s + (i.amount || 1), 0);
  const unit = EACH.test(l) ? value : Math.round(value / qty);
  return { prices: items.map(() => unit), reason: qty > 1 ? 'unit price' : 'single value' };
};

/** True when every slot got the expected price (1 NP tolerance for rounding). */
export const wishlistPricesMatch = (sent: (number | null)[], expected: (number | null)[]) =>
  sent.length === expected.length &&
  sent.every((p, i) => {
    const e = expected[i];
    if (p == null || e == null) return p == e;
    return Math.abs(p - e) <= 1;
  });
