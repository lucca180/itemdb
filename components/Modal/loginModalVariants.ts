import type { IconType } from 'react-icons';
import { LuChartLine, LuGauge, LuImport, LuListChecks, LuPlug, LuThumbsUp } from 'react-icons/lu';
import type { LoginSource } from '@utils/loginModal';

/*
 * Contextual copy for the login modal.
 *
 * Text lives in translation/{en,pt}.json, under `Login`, with keys derived from the ids here:
 * - variant: `variant-<id>-title`, `variant-<id>-description`
 * - perk:    `perk-<id>-title`,    `perk-<id>-description`
 *
 * Add a variant: add the source to LOGIN_SOURCES (utils/loginModal.ts), list its perks in
 * LOGIN_VARIANTS below, then add the two `variant-<source>-*` keys to both translation files.
 * Add a perk: add it to LOGIN_PERKS with an icon, then the two `perk-<id>-*` keys.
 * Sources without a variant use `default`.
 */

/** Every claim here must stay true (limits: utils/api/redis.ts API_CONST). */
export const LOGIN_PERKS = {
  lists: { icon: LuListChecks },
  import: { icon: LuImport },
  restock: { icon: LuChartLine },
  prices: { icon: LuThumbsUp },
  scripts: { icon: LuPlug },
  api: { icon: LuGauge },
} satisfies Record<string, { icon: IconType }>;

export type LoginPerkId = keyof typeof LOGIN_PERKS;

type LoginVariant = {
  /** Shown in this order; keep it to about three so the modal stays short on mobile. */
  perks: LoginPerkId[];
};

export type LoginVariantId = LoginSource | 'default';

const LOGIN_VARIANTS: Partial<Record<LoginVariantId, LoginVariant>> & {
  default: LoginVariant;
} = {
  default: { perks: ['lists', 'import', 'restock'] },
  'restock-dashboard': { perks: ['restock', 'scripts', 'api'] },
  'add-to-list': { perks: ['lists', 'import', 'scripts'] },
  import: { perks: ['import', 'lists', 'scripts'] },
  search: { perks: ['lists', 'import', 'api'] },
  checklist: { perks: ['lists', 'import', 'prices'] },
  'nc-report': { perks: ['prices', 'lists', 'import'] },
  troubleshooting: { perks: ['scripts', 'api', 'restock'] },
};

/** The variant id (translation key part) and perks for a source, falling back to `default`. */
export function getLoginVariant(source: LoginSource) {
  const id: LoginVariantId = LOGIN_VARIANTS[source] ? source : 'default';
  const { perks } = LOGIN_VARIANTS[id] ?? LOGIN_VARIANTS.default;

  return { id, perks: perks.map((perkId) => ({ id: perkId, ...LOGIN_PERKS[perkId] })) };
}
