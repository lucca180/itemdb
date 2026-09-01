import { describe, expect, test } from 'vitest';
import { resolveRelatedLinkCandidates, type RelatedLinkCandidate } from '@utils/item/relatedLinks';

function candidate(overrides: Partial<RelatedLinkCandidate> = {}): RelatedLinkCandidate {
  return {
    id: 'rainbow:browse:species:acara',
    href: '/rainbow-pool/acara',
    family: 'rainbow',
    source: 'item-name',
    specificity: 'browse',
    priority: 10,
    ...overrides,
  };
}

describe('resolveRelatedLinkCandidates', () => {
  test('preserves the configured family order', () => {
    const resolved = resolveRelatedLinkCandidates([
      candidate({ id: 'nc', href: '/articles/nc', family: 'nc' }),
      candidate({ id: 'petpet', href: '/search?petpet=1', family: 'petpet' }),
      candidate({ id: 'outfits', href: '/hub/outfits/acara', family: 'outfits' }),
      candidate({ id: 'styles', href: '/rainbow-pool/pet-styles', family: 'pet-styles' }),
      candidate({ id: 'checklist', href: '/lists/import', family: 'checklist' }),
      candidate(),
    ]);

    expect(resolved.map((link) => link.family)).toEqual([
      'rainbow',
      'outfits',
      'pet-styles',
      'checklist',
      'petpet',
      'nc',
    ]);
  });

  test('sorts by priority within a family and keeps ties stable', () => {
    const resolved = resolveRelatedLinkCandidates([
      candidate({ id: 'browse-a', href: '/rainbow-pool/acara', priority: 10 }),
      candidate({ id: 'combo', href: '/rainbow-pool/acara/faerie', priority: 0 }),
      candidate({ id: 'browse-b', href: '/rainbow-pool/faerie', priority: 10 }),
    ]);

    expect(resolved.map((link) => link.id)).toEqual(['combo', 'browse-a', 'browse-b']);
  });

  test('deduplicates the same combo emitted by PB and ItemEffect', () => {
    const resolved = resolveRelatedLinkCandidates([
      candidate({
        id: 'rainbow:combo:acara:faerie',
        href: '/rainbow-pool/acara/faerie',
        source: 'pb-outfit',
        specificity: 'combo',
        priority: 0,
      }),
      candidate({
        id: 'rainbow:combo:acara:faerie',
        href: '/rainbow-pool/acara/faerie',
        source: 'item-effect',
        specificity: 'combo',
        priority: 0,
      }),
    ]);

    expect(resolved).toHaveLength(1);
    expect(resolved[0].source).toBe('pb-outfit');
  });

  test('deduplicates equivalent non-checklist hrefs with different ids', () => {
    const resolved = resolveRelatedLinkCandidates([
      candidate(),
      candidate({
        id: 'rainbow:browse:species:acara-from-effect',
        source: 'item-effect',
      }),
    ]);

    expect(resolved).toHaveLength(1);
  });

  test('keeps distinct checklist identities that share the import href', () => {
    const resolved = resolveRelatedLinkCandidates([
      candidate({
        id: 'checklist:gourmet-food',
        href: '/lists/import',
        family: 'checklist',
        source: 'official-list',
        specificity: 'guide',
        priority: 0,
      }),
      candidate({
        id: 'checklist:neodeck',
        href: '/lists/import',
        family: 'checklist',
        source: 'official-list',
        specificity: 'guide',
        priority: 0,
      }),
    ]);

    expect(resolved.map((link) => link.id)).toEqual([
      'checklist:gourmet-food',
      'checklist:neodeck',
    ]);
  });

  test('retains name-derived links when they are not exact duplicates', () => {
    const resolved = resolveRelatedLinkCandidates([
      candidate(),
      candidate({
        id: 'outfits:species:acara',
        href: '/hub/outfits/acara',
        family: 'outfits',
      }),
      candidate({
        id: 'pet-styles:browse:species:acara',
        href: '/rainbow-pool/pet-styles/acara',
        family: 'pet-styles',
      }),
    ]);

    expect(resolved).toHaveLength(3);
  });
});
