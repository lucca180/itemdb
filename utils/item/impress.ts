import Axios from 'axios';
import Chance from 'chance';
import {
  DTIBodiesAndTheirZones,
  DTICanonicalAppearance,
  DTIColor,
  DTIItemPreview,
  DTILayer,
  DTIPetAppearance,
} from '../../types';
import {
  DTI_ALL_COLORS,
  GET_ITEM_LAYER_BY_REMOTE_ID,
  GET_ITEM_PREVIEW_BY_NAME,
  GET_ITEM_RATIOS_BY_NAME,
  GET_ITEMS_PREVIEW_BY_NAME,
  GET_PET_APPEARANCE_ANY_POSE,
} from './impressConsts';

const chance = new Chance();

const request = Axios.create({
  baseURL: 'https://impress-2020.openneo.net/api/',
  timeout: 15000,
  headers: {
    'accept-encoding': '*',
    'User-Agent': 'itemdb/1.0 (+https://itemdb.com.br)',
  },
});

export class dti {
  public static async _query(query: string, variables: any = null) {
    const payload: any = { query: query };

    if (variables) payload['variables'] = variables;

    const res = await request.post('graphql', payload);

    return res.data.data;
  }

  public static getRandomPet() {
    const allPetCombos: DTIColor[] = DTI_ALL_COLORS.data.allColors;

    let color = chance.pickone(allPetCombos);
    while (!color.isStandard && color.name !== 'Baby') color = chance.pickone(allPetCombos);

    const specie = chance.pickone(color.appliedToAllCompatibleSpecies).species;
    return {
      species: {
        id: specie.id,
        name: specie.name,
      },
      color: {
        id: color.id,
        name: color.name,
      },
    };
  }

  public static async fetchItemPreview(itemName: string) {
    const pet = dti.getRandomPet();

    const variables = {
      itemName: itemName,
      species: pet.species.id,
      color: pet.color.id,
    };

    const res = await dti._query(GET_ITEM_PREVIEW_BY_NAME, variables);

    const item = res.itemByName as DTIItemPreview & {
      compatibleBodiesAndTheirZones: DTIBodiesAndTheirZones[];
    };

    if (item) await dti.replaceGlitchedBodyAppearances([item]);

    return item;
  }

  public static async fetchItemLayer(remoteId: number) {
    const res = await dti._query(GET_ITEM_LAYER_BY_REMOTE_ID, { remoteId: remoteId });

    return res.appearanceLayerByRemoteId as DTILayer;
  }

  public static async fetchRatiosByName(itemName: string) {
    const res = await dti._query(GET_ITEM_RATIOS_BY_NAME, { itemName: itemName });
    return res.itemByName as {
      id: number;
      name: string;
      numUsersSeekingThis: number;
      numUsersOfferingThis: number;
    };
  }

  public static async fetchOutfitPreview(
    itemNames: string[],
    options?: { speciesId?: number; colorId?: number }
  ) {
    const pet = dti.getRandomPet();

    const variables = {
      itemNames: itemNames,
      species: options?.speciesId ?? pet.species.id,
      color: options?.colorId ?? pet.color.id,
    };

    const res = await dti._query(GET_ITEMS_PREVIEW_BY_NAME, variables);
    const items = res.itemsByName as (DTIItemPreview & {
      compatibleBodiesAndTheirZones: DTIBodiesAndTheirZones[];
    })[];

    if (items) await dti.replaceGlitchedBodyAppearances(items);

    return items;
  }

  public static async fetchPetAppearances(speciesId: number | string, colorId: number | string) {
    const variables = {
      speciesId: speciesId,
      colorId: colorId,
    };

    const res = await dti._query(GET_PET_APPEARANCE_ANY_POSE, variables);
    // DTI returns null data for combos it doesn't know
    return (res?.petAppearances ?? []) as DTIPetAppearance[];
  }

  public static async fetchPetPreview(
    speciesId: number,
    colorId: number
  ): Promise<DTIPetAppearance | undefined> {
    const petAppearances = await dti.fetchPetAppearances(speciesId, colorId);

    return pickPetAppearance(petAppearances) ?? petAppearances[0];
  }

  // DTI's canonical body appearance can be a glitched one (e.g. Alien Aisha / MSP Poogle
  // come with an extra "Eyes" layer), so swap it for a non-glitched appearance of the same body
  public static async replaceGlitchedBodyAppearances(items: DTIItemPreview[]) {
    const replacements = new Map<string, Promise<DTIPetAppearance | null>>();

    const getReplacement = (glitched: DTIPetAppearance) => {
      if (!replacements.has(glitched.id)) {
        const replacement = dti
          .fetchPetAppearances(glitched.species.id, glitched.color.id)
          .then((appearances) =>
            pickPetAppearance(
              appearances.filter((a) => a.bodyId === glitched.bodyId),
              glitched.pose
            )
          )
          .catch(() => null);

        replacements.set(glitched.id, replacement);
      }

      return replacements.get(glitched.id)!;
    };

    await Promise.all(
      items.map(async (item) => {
        const body = item?.canonicalAppearance?.body;
        if (!body?.canonicalAppearance?.isGlitched) return;

        const replacement = await getReplacement(body.canonicalAppearance);
        if (replacement) body.canonicalAppearance = replacement;
      })
    );
  }

  public static async getItemPreview(itemName: string) {
    const item = await this.fetchItemPreview(itemName);

    const layers = [
      ...item.canonicalAppearance.layers,
      ...item.canonicalAppearance.body.canonicalAppearance.layers,
    ].sort((a, b) => a.zone.depth - b.zone.depth);

    const imageURLs = [];

    for (const layer of layers) imageURLs.push(layer.imageUrlV2);

    const images = await loadImages(imageURLs);

    const canvas = document.createElement('canvas');
    canvas.setAttribute('crossOrigin', 'anonymous');
    canvas.width = 600;
    canvas.height = 600;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Não há Canvas.');

    for (const image of images) ctx.drawImage(image, 0, 0, 600, 600);

    return canvas;
  }
}

const loadImages = async (urls: string[]) => {
  const promises: Promise<HTMLImageElement>[] = [];
  for (const url of urls) {
    promises.push(loadImage(url));
  }
  return Promise.all(promises);
};

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);

    img.src = url;
  });
};

export function getVisibleLayers(
  petAppearance: DTIPetAppearance,
  itemAppearances: DTICanonicalAppearance[]
) {
  if (!petAppearance) {
    return [];
  }

  const validItemAppearances = itemAppearances.filter((a) => a);

  const petLayers = petAppearance.layers.map((l) => ({ ...l, source: 'pet' }));

  const itemLayers = validItemAppearances
    .map((a) => a.layers)
    .flat()
    .map((l) => ({ ...l, source: 'item' }));

  const allLayers = [...petLayers, ...itemLayers];

  const itemRestrictedZoneIds = new Set(
    validItemAppearances
      .map((a) => a.restrictedZones)
      .flat()
      .map((z) => z.id)
  );
  const petRestrictedZoneIds = new Set(petAppearance.restrictedZones.map((z) => z.id));

  const visibleLayers = allLayers.filter((layer) => {
    if (layer.source === 'pet' && itemRestrictedZoneIds.has(layer.zone.id)) {
      return false;
    }
    if (
      layer.source === 'item' &&
      layer.bodyId !== '0' &&
      (petAppearance.pose === 'UNCONVERTED' || petRestrictedZoneIds.has(layer.zone.id))
    ) {
      return false;
    }
    if (layer.source === 'pet' && petRestrictedZoneIds.has(layer.zone.id)) {
      return false;
    }

    return true;
  });

  visibleLayers.sort((a, b) => a.zone.depth - b.zone.depth);

  return visibleLayers;
}

const HAPPY_POSES = ['HAPPY_MASC', 'HAPPY_FEM'];

export function pickPetAppearance(
  appearances: DTIPetAppearance[],
  preferredPose?: string
): DTIPetAppearance | null {
  const notGlitched = appearances.filter((a) => !a.isGlitched);

  return (
    notGlitched.find((a) => preferredPose && a.pose === preferredPose) ??
    notGlitched.find((a) => HAPPY_POSES.includes(a.pose)) ??
    notGlitched.find((a) => a.pose !== 'UNCONVERTED' && a.pose !== 'UNKNOWN') ??
    appearances.find((a) => HAPPY_POSES.includes(a.pose)) ??
    null
  );
}

export function resolveItemAppearanceConflicts(
  itemAppearances: (DTICanonicalAppearance | null | undefined)[]
) {
  const resolvedAppearances: DTICanonicalAppearance[] = [];

  for (const itemAppearance of itemAppearances) {
    if (!itemAppearance) continue;

    const itemZones = getAppearanceZones(itemAppearance);

    const compatibleAppearances = resolvedAppearances.filter((resolvedAppearance) => {
      const resolvedZones = getAppearanceZones(resolvedAppearance);

      return !(
        setsIntersect(itemZones.occupied, resolvedZones.occupiedOrRestricted) ||
        setsIntersect(resolvedZones.occupied, itemZones.occupiedOrRestricted)
      );
    });

    resolvedAppearances.length = 0;
    resolvedAppearances.push(...compatibleAppearances, itemAppearance);
  }

  return resolvedAppearances;
}

const getAppearanceZones = (appearance: DTICanonicalAppearance) => {
  const occupied = new Set(appearance.layers.map((layer) => layer.zone.id));
  const restricted = appearance.restrictedZones.map((zone) => zone.id);

  return {
    occupied,
    occupiedOrRestricted: new Set([...occupied, ...restricted]),
  };
};

const setsIntersect = (first: Set<string>, second: Set<string>) => {
  for (const value of first) {
    if (second.has(value)) return true;
  }

  return false;
};
