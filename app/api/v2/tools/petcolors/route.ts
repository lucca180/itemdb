import type { NextRequest } from 'next/server';
import { getPetColorComboV2FromQuery } from '@app/server/petColorCombo';

/**
 * GET /api/v2/tools/petcolors?colorTarget=&speciesTarget=
 * ItemV2 (`card`) version of `/api/v1/tools/petcolors`.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const colorTarget = searchParams.get('colorTarget') ?? undefined;
  const speciesTarget = searchParams.get('speciesTarget') ?? undefined;

  const result = await getPetColorComboV2FromQuery(
    colorTarget || undefined,
    speciesTarget || undefined
  );

  if (!result.ok) {
    if (result.error === 'missing_params') {
      return Response.json({ error: 'Missing query parameters' }, { status: 400 });
    }
    return Response.json({ error: 'pet_color_not_found' }, { status: 400 });
  }

  return Response.json(result.data);
}
