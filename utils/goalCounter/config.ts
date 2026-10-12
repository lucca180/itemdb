// Goal counter image config <-> short URL code.
//
// The code is what users paste on Neopets (`/goal/lists/<list_id>/<code>.png`), so it must stay
// stable forever: never reorder or remove entries from the arrays below, only append.
//
// Layout (v1, 12 bits): [version:3][variant:4][bg:1][checksum:4], XOR-masked and written in base36.

export const GOAL_VARIANTS = [
  'mosaic',
  'reveal',
  'page-header',
  'page-value',
  'page-legend',
] as const;

export const GOAL_BACKGROUNDS = ['transparent', 'paper'] as const;

export type GoalVariant = (typeof GOAL_VARIANTS)[number];
export type GoalBackground = (typeof GOAL_BACKGROUNDS)[number];

export type GoalConfig = {
  variant: GoalVariant;
  bg: GoalBackground;
};

const VERSION = 1;
const MASK = 0xa5c;

// mosaic and reveal are always transparent
export const variantSupportsPaper = (variant: GoalVariant) => variant.startsWith('page-');

const checksum = (word: number) => (word * 7 + 3) % 16;

export function encodeGoalConfig(config: GoalConfig): string {
  const variant = GOAL_VARIANTS.indexOf(config.variant);
  if (variant === -1) throw new Error(`Unknown goal variant: ${config.variant}`);

  const bgName = variantSupportsPaper(config.variant) ? config.bg : 'transparent';
  const bg = GOAL_BACKGROUNDS.indexOf(bgName);
  if (bg === -1) throw new Error(`Unknown goal background: ${config.bg}`);

  const word = (VERSION << 5) | (variant << 1) | bg;
  const value = ((word << 4) | checksum(word)) ^ MASK;

  return value.toString(36).padStart(3, '0');
}

/** Absolute origin used in the embed code users paste on Neopets (also in dev). */
export const GOAL_SITE_URL = 'https://itemdb.com.br';

export const goalListImagePath = (listId: number, config: GoalConfig) =>
  `/goal/lists/${listId}/${encodeGoalConfig(config)}.png`;

export function decodeGoalConfig(code: string): GoalConfig | null {
  if (!/^[0-9a-z]{3}$/.test(code)) return null;

  const value = parseInt(code, 36) ^ MASK;
  if (value < 0 || value > 0xfff) return null;

  const word = value >> 4;
  if ((value & 0xf) !== checksum(word)) return null;
  if (word >> 5 !== VERSION) return null;

  const variant = GOAL_VARIANTS[(word >> 1) & 0xf];
  const bg = GOAL_BACKGROUNDS[word & 1];
  if (!variant || !bg) return null;
  if (bg === 'paper' && !variantSupportsPaper(variant)) return null;

  return { variant, bg };
}
