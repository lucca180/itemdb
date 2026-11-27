import {
  PRICE_CHECKER_PAGES,
  type PriceCheckerPage,
} from '@app/[locale]/tools/price-checker/priceCheckerPages';
import { stampAlbumShortName } from '@app/[locale]/lists/official/_categories/stamps';

/** The Neopets page the List Importer reads to fill a checklist of an official list */
export type ChecklistImportPage = {
  href: string;
  labelKey: PriceCheckerPage['labelKey'];
  /** Stamp Album page name (e.g. "Snowy Valley"); unset when the list spans the whole album */
  albumPage?: string;
};

/** Official lists the List Importer recommends for its page (`meta.list_id` in listImporter.user.js) */
const IMPORT_PAGE_BY_LIST: Record<number, PriceCheckerPage['id']> = {
  72: 'gourmet-club',
  248: 'neodeck',
  663: 'booktastic',
  664: 'book-award',
  31462: 'archived-bookshelf',
};

type SourceList = {
  internal_id: number;
  name: string;
  description?: string | null;
  official: boolean;
  /** Has the `stamps` official tag */
  isStamps: boolean;
};

const pageById = (id: PriceCheckerPage['id']) => PRICE_CHECKER_PAGES.find((p) => p.id === id);

/** Album pages keep their link in the description, the same one `importMeta.ts` matches */
const albumPageId = (description: string | null | undefined) =>
  description?.match(/[&?]page_id=(\d+)(?!\d)/)?.[1] ?? null;

/** Where to import a checklist of `source` from, or `null` when no single Neopets page fills it */
export function getChecklistImportPage(source: SourceList): ChecklistImportPage | null {
  if (!source.official) return null;

  if (source.isStamps) {
    const album = pageById('stamp-album');
    if (!album) return null;

    const pageId = albumPageId(source.description);
    if (!pageId) return { href: album.href, labelKey: album.labelKey };

    return {
      href: `https://www.neopets.com/stamps.phtml?type=album&page_id=${pageId}&owner=`,
      labelKey: album.labelKey,
      albumPage: stampAlbumShortName(source.name),
    };
  }

  const pageId = IMPORT_PAGE_BY_LIST[source.internal_id];
  const page = pageId ? pageById(pageId) : null;

  return page ? { href: page.href, labelKey: page.labelKey } : null;
}

export const isStampsList = (officialTag: string[] | null | undefined) =>
  !!officialTag?.some((tag) => tag.toLowerCase() === 'stamps');
