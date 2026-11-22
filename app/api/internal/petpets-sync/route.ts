import axios from 'axios';
import { revalidateTag } from 'next/cache';
import prisma from '@utils/prisma';
import { PETPET_CATALOG_CACHE_TAG } from '@utils/pet-utils';
import { itemSectionTag } from '@utils/appCacheTags';
import { revalidateAppCacheTags } from '@utils/revalidateAppCacheTags';
import {
  findHiddenSpeciesNeoIds,
  isPuddleSnapshot,
  isSpeciesColorsResponse,
  loadLinkSyncInput,
  mergeHiddenSpeciesCombos,
  planCatalogSync,
  planLinkSync,
  type PuddleSnapshot,
  type PuddleSpeciesColor,
} from '@utils/petpet-sync';

const TARNUM_KEY = process.env.TARNUM_KEY;
const TARNUM_SERVER = process.env.TARNUM_SERVER;

function isAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV === 'development') return true;
  const auth = request.headers.get('authorization');
  return !!auth && auth === TARNUM_KEY;
}

const catalogSelect = { internal_id: true, neo_id: true, map_id: true, name: true } as const;

/**
 * Syncs petpet species/colors and item ↔ species ↔ color links with the Petpet Puddle.
 * `?dryRun=1` returns the plan without writing (link plan then uses the current catalog).
 * Rules: see `@utils/petpet-sync`.
 */
async function syncPetpets(request: Request) {
  if (!TARNUM_SERVER) {
    return Response.json({ error: 'TARNUM_SERVER is not configured' }, { status: 500 });
  }

  const dryRun = ['1', 'true'].includes(new URL(request.url).searchParams.get('dryRun') ?? '');

  let puddle: PuddleSnapshot;
  try {
    const res = await axios.get(TARNUM_SERVER + '/neopets/pool', {
      params: { mode: 'AllPetpets' },
      timeout: 60000,
    });
    if (!res.data?.success || !isPuddleSnapshot(res.data)) {
      return Response.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
    puddle = res.data;
  } catch (e) {
    console.error('[petpets-sync]', e);
    return Response.json({ error: 'Failed to fetch data' }, { status: 500 });
  }

  // ------- Catalog ------- //
  const [speciesRows, colorRows] = await Promise.all([
    prisma.petpetSpecies.findMany({ select: catalogSelect }),
    prisma.petpetColorCatalog.findMany({ select: catalogSelect }),
  ]);

  const speciesPlan = planCatalogSync(speciesRows, puddle.speciesList);
  const colorPlan = planCatalogSync(colorRows, puddle.colors);
  const catalogChanged =
    speciesPlan.create.length +
      speciesPlan.setNeoId.length +
      colorPlan.create.length +
      colorPlan.setNeoId.length >
    0;

  if (!dryRun && catalogChanged) {
    await prisma.$transaction([
      prisma.petpetSpecies.createMany({ data: speciesPlan.create, skipDuplicates: true }),
      prisma.petpetColorCatalog.createMany({ data: colorPlan.create, skipDuplicates: true }),
      ...speciesPlan.setNeoId.map((row) =>
        prisma.petpetSpecies.update({
          where: { internal_id: row.internal_id },
          data: { neo_id: row.neo_id },
        })
      ),
      ...colorPlan.setNeoId.map((row) =>
        prisma.petpetColorCatalog.update({
          where: { internal_id: row.internal_id },
          data: { neo_id: row.neo_id },
        })
      ),
    ]);
    revalidateTag(PETPET_CATALOG_CACHE_TAG, { expire: 0 });
  }

  // ------- Hidden species ------- //
  // Species we know by neo_id that AllPetpets doesn't list (Tentacle, Haseepuss…).
  const hiddenSpecies: { neo_id: number; colors: number | null; error?: string }[] = [];
  const hiddenCombos: Record<number, PuddleSpeciesColor[]> = {};
  for (const neoId of findHiddenSpeciesNeoIds(speciesRows, puddle)) {
    try {
      const res = await axios.get(TARNUM_SERVER + '/neopets/pool', {
        params: { mode: 'getAllPetpetColors', f_species_id: neoId },
        timeout: 60000,
      });
      if (!isSpeciesColorsResponse(res.data)) throw new Error('Invalid response');
      hiddenCombos[neoId] = res.data.items;
      hiddenSpecies.push({ neo_id: neoId, colors: res.data.items.length });
    } catch (e) {
      console.error('[petpets-sync] hidden species', neoId, e);
      hiddenSpecies.push({ neo_id: neoId, colors: null, error: 'Failed to fetch colors' });
    }
  }
  puddle = mergeHiddenSpeciesCombos(puddle, hiddenCombos);

  // ------- Links ------- //
  const linkInput = await loadLinkSyncInput(puddle);
  const linkPlan = planLinkSync({ puddle, ...linkInput });

  let linksCreated = 0;
  let linksMarkedPaintable = 0;

  if (!dryRun) {
    const markIds = linkPlan.markPaintable.map((l) => l.item_iid);
    const [created, marked] = await prisma.$transaction([
      prisma.petpetColors.createMany({
        data: linkPlan.create.map(
          ({ item_iid, petpet_id, color_id, isUnpaintable, isCanonical }) => ({
            item_iid,
            petpet_id,
            color_id,
            isUnpaintable,
            isCanonical,
          })
        ),
        skipDuplicates: true,
      }),
      prisma.petpetColors.updateMany({
        where: { item_iid: { in: markIds }, isUnpaintable: true },
        data: { isUnpaintable: false },
      }),
    ]);
    linksCreated = created.count;
    linksMarkedPaintable = marked.count;

    const touched = new Set([...linkPlan.create.map((l) => l.item_iid), ...markIds]);
    revalidateAppCacheTags([...touched].map((iid) => itemSectionTag(iid, 'petpet')));
  }

  return Response.json({
    dryRun,
    puddle: {
      species: puddle.speciesList.length,
      colors: puddle.colors.length,
      combos: Object.values(puddle.colorsBySpecies).flat().length,
      hiddenSpecies,
    },
    catalog: { species: speciesPlan, colors: colorPlan },
    links: {
      create: linkPlan.create,
      markPaintable: linkPlan.markPaintable,
      created: linksCreated,
      markedPaintable: linksMarkedPaintable,
    },
    report: linkPlan.report,
  });
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return syncPetpets(request);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return syncPetpets(request);
}
