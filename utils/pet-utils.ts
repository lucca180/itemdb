import { slugify } from '@utils/utils';

export const PET_COLORS_CACHE_TAG = 'pet-colors';
export const PETPET_CATALOG_CACHE_TAG = 'petpet-catalog';

/** Preferred display/URL names when the upstream API uses a different spelling. */
export const PET_COLOR_NAME_OVERRIDES: Record<number, string> = {
  81: 'Usuki Boy',
  82: 'Usuki Girl',
  98: 'Elderlygirl',
};

export type PetColorsCatalog = Record<string, string>;

/** URL segment for a colour/species name (`25th Anniversary` → `25th-anniversary`). */
export function petColorSlug(name: string): string {
  return slugify(name);
}

export function findPetColorId(color: string, colors: PetColorsCatalog): number | null {
  if (!color) return null;
  const needle = petColorSlug(color);
  const id = Object.keys(colors).find((key) => petColorSlug(colors[key]) === needle);
  if (!id) return null;
  return parseInt(id, 10);
}

export function findPetColorName(
  id: number | string,
  colors: PetColorsCatalog
): string | undefined {
  return colors[String(id)];
}

export const allSpecies: { [id: string]: string } = {
  '1': 'Acara',
  '2': 'Aisha',
  '3': 'Blumaroo',
  '4': 'Bori',
  '5': 'Bruce',
  '6': 'Buzz',
  '7': 'Chia',
  '8': 'Chomby',
  '9': 'Cybunny',
  '10': 'Draik',
  '11': 'Elephante',
  '12': 'Eyrie',
  '13': 'Flotsam',
  '14': 'Gelert',
  '15': 'Gnorbu',
  '16': 'Grarrl',
  '17': 'Grundo',
  '18': 'Hissi',
  '19': 'Ixi',
  '20': 'Jetsam',
  '21': 'JubJub',
  '22': 'Kacheek',
  '23': 'Kau',
  '24': 'Kiko',
  '25': 'Koi',
  '26': 'Korbat',
  '27': 'Kougra',
  '28': 'Krawk',
  '29': 'Kyrii',
  '30': 'Lenny',
  '31': 'Lupe',
  '32': 'Lutari',
  '33': 'Meerca',
  '34': 'Moehog',
  '35': 'Mynci',
  '36': 'Nimmo',
  '37': 'Ogrin',
  '38': 'Peophin',
  '39': 'Poogle',
  '40': 'Pteri',
  '41': 'Quiggle',
  '42': 'Ruki',
  '43': 'Scorchio',
  '44': 'Shoyru',
  '45': 'Skeith',
  '46': 'Techo',
  '47': 'Tonu',
  '48': 'Tuskaninny',
  '49': 'Uni',
  '50': 'Usul',
  '51': 'Wocky',
  '52': 'Xweetok',
  '53': 'Yurble',
  '54': 'Zafara',
  '55': 'Vandagyre',
  '56': 'Varwolf',
};

export const getSpeciesId = (species: string) => {
  if (!species) return null;
  const needle = petColorSlug(species);
  const x = Object.keys(allSpecies).find((id) => petColorSlug(allSpecies[id]) === needle);
  if (!x) return null;
  return parseInt(x);
};

export const getSpeciesFromString = (name: string) => {
  if (!name) return null;
  const species = Object.values(allSpecies).find((species) =>
    name.toLowerCase().split(' ').includes(species.toLowerCase())
  );
  return species;
};
