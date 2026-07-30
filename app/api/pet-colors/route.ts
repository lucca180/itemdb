import { getAllNeopetsColors } from '@app/server/petColors';

export async function GET() {
  const colors = await getAllNeopetsColors();
  return Response.json({ colors });
}
