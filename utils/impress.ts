import Axios from 'axios';
import Chance from 'chance';
import {
  DTIBodiesAndTheirZones,
  DTICanonicalAppearance,
  DTIColor,
  DTIItemPreview,
  DTIPetAppearance,
} from '../types';
import {
  DTI_ALL_COLORS,
  GET_ITEM_PREVIEW_BY_NAME,
  GET_ITEMS_PREVIEW_BY_NAME,
  GET_PET_APPEARANCE_ANY_POSE,
} from './impressConsts';

const chance = new Chance();

const request = Axios.create({
  baseURL: 'https://impress-2020.openneo.net/api/',
  timeout: 10000,
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

    return res.itemByName as DTIItemPreview & {
      compatibleBodiesAndTheirZones: DTIBodiesAndTheirZones[];
    };
  }

  public static async fetchOutfitPreview(itemNames: string[]) {
    const pet = dti.getRandomPet();

    const variables = {
      itemNames: itemNames,
      species: pet.species.id,
      color: pet.color.id,
    };

    const res = await dti._query(GET_ITEMS_PREVIEW_BY_NAME, variables);
    return res.itemsByName as (DTIItemPreview & {
      compatibleBodiesAndTheirZones: DTIBodiesAndTheirZones[];
    })[];
  }

  public static async fetchPetPreview(speciesId: number, colorId: number) {
    const variables = {
      speciesId: speciesId,
      colorId: colorId,
    };

    const res = await dti._query(GET_PET_APPEARANCE_ANY_POSE, variables);
    const petAppearances = res.petAppearances as DTIPetAppearance[];
    const happy = petAppearances.find(
      (pet) => pet.pose === 'HAPPY_MASC' || pet.pose === 'HAPPY_FEM'
    );

    return happy || petAppearances[0];
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
