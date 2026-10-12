// Goal counter image config <-> short URL code.
//
// The code is what users paste on Neopets (`/goal/lists/<list_id>/<code>.png`), so it must stay
// stable forever: never reorder or remove entries from the arrays below, only append.
//
// v1 (3 chars, 12 bits): [version:3][variant:4][bg:1][checksum:4]
// v2 (6 chars, 28 bits): [version:3][variant:4][bg:2][hideNumber:1][target:14][checksum:4]
// Both are XOR-masked and written in base36. The first stamp variants (V1_VARIANTS) always encode
// as v1 so the codes already handed out keep working; every other variant encodes as v2.

export const GOAL_VARIANTS = [
  'mosaic',
  'reveal',
  'page-header',
  'page-value',
  'page-legend',
  'classic',
  'stamp-classic',
] as const;

export const GOAL_BACKGROUNDS = ['transparent', 'paper'] as const;

export type GoalVariant = (typeof GOAL_VARIANTS)[number];
export type GoalBackground = (typeof GOAL_BACKGROUNDS)[number];

export type GoalConfig = {
  variant: GoalVariant;
  bg: GoalBackground;
  /** classic variants only — hide the "owned/target" number */
  showNumber?: boolean;
  /** collections only — custom goal; null/undefined means the official list total */
  target?: number | null;
};

export const STAMP_VARIANTS = [
  'mosaic',
  'reveal',
  'page-header',
  'page-value',
  'page-legend',
  'stamp-classic',
] as const satisfies readonly GoalVariant[];

/** Variants encoded as v1 (3-char codes); never add to this list. */
const V1_VARIANTS: readonly GoalVariant[] = [
  'mosaic',
  'reveal',
  'page-header',
  'page-value',
  'page-legend',
];

/** Variants with the classic bar layout, which can hide the number. */
const CLASSIC_VARIANTS: readonly GoalVariant[] = ['classic', 'stamp-classic'];

export const COLLECTION_VARIANTS = ['classic'] as const satisfies readonly GoalVariant[];

export type StampVariant = (typeof STAMP_VARIANTS)[number];
export type CollectionVariant = (typeof COLLECTION_VARIANTS)[number];

export const GOAL_TARGET_MAX = 9999;

/** Backgrounds each variant can render, the first one being the default. */
export const VARIANT_BACKGROUNDS: Record<GoalVariant, readonly GoalBackground[]> = {
  mosaic: ['transparent'],
  reveal: ['transparent'],
  'page-header': ['transparent', 'paper'],
  'page-value': ['transparent', 'paper'],
  'page-legend': ['transparent', 'paper'],
  classic: ['transparent', 'paper'],
  'stamp-classic': ['transparent', 'paper'],
};

/** Image size of each variant, in pixels. */
export const GOAL_SIZES: Record<GoalVariant, [number, number]> = {
  mosaic: [96, 88],
  reveal: [96, 84],
  'page-header': [150, 76],
  'page-value': [152, 60],
  'page-legend': [152, 72],
  classic: [168, 48],
  'stamp-classic': [174, 56],
};

export const isStampVariant = (variant: GoalVariant): variant is StampVariant =>
  (STAMP_VARIANTS as readonly GoalVariant[]).includes(variant);

/** Absolute origin used in the embed code users paste on Neopets (also in dev). */
export const GOAL_SITE_URL = 'https://itemdb.com.br';

export const goalListImagePath = (listId: number, config: GoalConfig) =>
  `/goal/lists/${listId}/${encodeGoalConfig(config)}.png`;

/** Fixed-data image (same for everyone, cached long); `sample` is "stamps-<album id>" or a collection slug. */
export const goalSampleImagePath = (sample: string, config: GoalConfig) =>
  `/goal/sample/${sample}/${encodeGoalConfig(config)}.png`;

const checksum = (word: number) => (word * 7 + 3) % 16;

const V1 = { version: 1, mask: 0xa5c, length: 3 };
const V2 = { version: 2, mask: 0xa5c3b1, length: 6 };

/** Fills defaults and drops options the variant doesn't support. */
export function normalizeGoalConfig(config: GoalConfig): Required<GoalConfig> {
  const allowed = VARIANT_BACKGROUNDS[config.variant];
  if (!allowed) throw new Error(`Unknown goal variant: ${config.variant}`);

  const isCollection = !isStampVariant(config.variant);
  const target =
    isCollection && config.target && config.target > 0
      ? Math.min(Math.floor(config.target), GOAL_TARGET_MAX)
      : null;

  return {
    variant: config.variant,
    bg: allowed.includes(config.bg) ? config.bg : allowed[0],
    showNumber: CLASSIC_VARIANTS.includes(config.variant) ? config.showNumber !== false : true,
    target,
  };
}

export function encodeGoalConfig(config: GoalConfig): string {
  const c = normalizeGoalConfig(config);
  const variant = GOAL_VARIANTS.indexOf(c.variant);
  const bg = GOAL_BACKGROUNDS.indexOf(c.bg);

  if (V1_VARIANTS.includes(c.variant)) {
    const word = (V1.version << 5) | (variant << 1) | bg;
    const value = ((word << 4) | checksum(word)) ^ V1.mask;
    return value.toString(36).padStart(V1.length, '0');
  }

  const word =
    (V2.version << 21) |
    (variant << 17) |
    (bg << 15) |
    ((c.showNumber ? 0 : 1) << 14) |
    (c.target ?? 0);
  const value = ((word << 4) | checksum(word)) ^ V2.mask;
  return value.toString(36).padStart(V2.length, '0');
}

export function decodeGoalConfig(code: string): GoalConfig | null {
  if (!/^[0-9a-z]+$/.test(code)) return null;
  if (code.length === V1.length) return decodeV1(code);
  if (code.length === V2.length) return decodeV2(code);
  return null;
}

function decodeV1(code: string): GoalConfig | null {
  const value = parseInt(code, 36) ^ V1.mask;
  if (value < 0 || value > 0xfff) return null;

  const word = value >> 4;
  if ((value & 0xf) !== checksum(word)) return null;
  if (word >> 5 !== V1.version) return null;

  const variant = GOAL_VARIANTS[(word >> 1) & 0xf];
  const bg = GOAL_BACKGROUNDS[word & 1];
  if (!variant || !bg || !V1_VARIANTS.includes(variant)) return null;
  if (!VARIANT_BACKGROUNDS[variant].includes(bg)) return null;

  return { variant, bg };
}

function decodeV2(code: string): GoalConfig | null {
  const value = parseInt(code, 36) ^ V2.mask;
  if (value < 0 || value > 0xfffffff) return null;

  const word = value >> 4;
  if ((value & 0xf) !== checksum(word)) return null;
  if (word >> 21 !== V2.version) return null;

  const variant = GOAL_VARIANTS[(word >> 17) & 0xf];
  const bg = GOAL_BACKGROUNDS[(word >> 15) & 0x3];
  const hideNumber = (word >> 14) & 1;
  const target = word & 0x3fff;

  if (!variant || !bg || V1_VARIANTS.includes(variant)) return null;
  if (!VARIANT_BACKGROUNDS[variant].includes(bg)) return null;
  if (target > GOAL_TARGET_MAX) return null;
  if (target && isStampVariant(variant)) return null;
  if (hideNumber && !CLASSIC_VARIANTS.includes(variant)) return null;

  return { variant, bg, showNumber: !hideNumber, target: target || null };
}
