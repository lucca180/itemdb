import { getAllPetpetColors, getAllPetpetSpecies } from '@app/server/petpetCatalog';
import { petpetCatalogToNameRecord } from '@utils/petpet-catalog';

/** Public petpet species + color catalogs (`map_id` → name). */
export async function GET() {
  const [speciesEntries, colorEntries] = await Promise.all([
    getAllPetpetSpecies(),
    getAllPetpetColors(),
  ]);

  return Response.json({
    species: petpetCatalogToNameRecord(speciesEntries),
    colors: petpetCatalogToNameRecord(colorEntries),
  });
}
