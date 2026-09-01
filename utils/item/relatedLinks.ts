export type RelatedLinkFamily =
  | 'rainbow'
  | 'outfits'
  | 'pet-styles'
  | 'checklist'
  | 'petpet'
  | 'nc';

export type RelatedLinkSpecificity = 'hub' | 'browse' | 'combo' | 'guide';

export type RelatedLinkCandidate = {
  id: string;
  href: string;
  family: RelatedLinkFamily;
  source: string;
  specificity: RelatedLinkSpecificity;
  priority: number;
};

const FAMILY_ORDER: Record<RelatedLinkFamily, number> = {
  rainbow: 0,
  outfits: 1,
  'pet-styles': 2,
  checklist: 3,
  petpet: 4,
  nc: 5,
};

function semanticIdentity(candidate: RelatedLinkCandidate): string {
  if (candidate.family === 'checklist') return candidate.id;
  return `${candidate.family}:${candidate.href}`;
}

export function resolveRelatedLinkCandidates<T extends RelatedLinkCandidate>(
  candidates: readonly T[]
): T[] {
  const indexed = candidates.map((candidate, index) => ({ candidate, index }));

  indexed.sort((a, b) => {
    const familyOrder = FAMILY_ORDER[a.candidate.family] - FAMILY_ORDER[b.candidate.family];
    if (familyOrder !== 0) return familyOrder;

    const priorityOrder = a.candidate.priority - b.candidate.priority;
    if (priorityOrder !== 0) return priorityOrder;

    return a.index - b.index;
  });

  const seenIds = new Set<string>();
  const seenSemanticLinks = new Set<string>();
  const resolved: T[] = [];

  for (const { candidate } of indexed) {
    const semanticKey = semanticIdentity(candidate);
    if (seenIds.has(candidate.id) || seenSemanticLinks.has(semanticKey)) continue;

    seenIds.add(candidate.id);
    seenSemanticLinks.add(semanticKey);
    resolved.push(candidate);
  }

  return resolved;
}
