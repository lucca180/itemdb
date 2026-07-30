import { getAllNeopetsColors } from '@utils/pet-colors';

export async function GET() {
  const colors = await getAllNeopetsColors();
  return Response.json({ colors });
}
