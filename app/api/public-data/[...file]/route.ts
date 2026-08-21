import { NextRequest, NextResponse } from 'next/server';
import requestIp from 'request-ip';
import { LogService } from '@services/ActionLogService';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { DUMPS_BUCKET, fileExists, getDumpSignedUrl } from '@utils/googleCloud';
import { canAccessPublicData } from '@app/[locale]/public-data/publicDataAccess';

type RouteContext = {
  params: Promise<{ file: string[] }>;
};

function resolveDumpKey(segments: string[]): string | null {
  if (segments.length === 0) return null;

  const decoded = segments.map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return null;
    }
  });

  if (
    decoded.some(
      (segment) => !segment || segment === '.' || segment === '..' || segment.includes('\\')
    )
  ) {
    return null;
  }

  return decoded.join('/');
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { user } = await getServerCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const access = canAccessPublicData(user);
  if (access === 'banned' || access === 'new_account') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { file } = await context.params;
  const key = resolveDumpKey(file);
  if (!key) {
    return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
  }

  const exists = await fileExists(key, DUMPS_BUCKET);
  if (!exists) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const signedUrl = await getDumpSignedUrl(key);
  const ip = requestIp.getClientIp(request as never);

  await LogService.createLog('publicDataDownload', { file: key }, key, user.id, ip);

  const response = NextResponse.redirect(signedUrl);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
