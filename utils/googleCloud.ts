import type { NextApiRequest } from 'next';
import prisma from './prisma';
import { User as dbUser } from '@prisma/generated/client';
import { rawToUser } from '../pages/api/auth/login';
import { verifySession, VerifiedSession } from './auth/jwt';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import axios from 'axios';

// Kept for backwards-compatibility — call sites that destructure `decodedToken`
// use its `uid` and `email` fields, which we populate from the JWT payload.
export type DecodedToken = {
  uid: string;
  email: string | undefined;
  role: string;
  exp: number;
};

/** No-op shim — kept so import sites that reference `Auth` don't break. */
export const Auth = {
  // intentionally empty — Firebase Auth has been removed
} as const;

export const CheckAuth = async (
  req: NextApiRequest | null,
  _token?: string,
  sessionOverride?: string,
  skipUser = false
): Promise<{ decodedToken: DecodedToken; user: ReturnType<typeof rawToUser> | null }> => {
  const sessionCookie = sessionOverride ?? req?.cookies?.session;
  if (!sessionCookie) throw new Error('No session cookie');

  let payload: VerifiedSession;
  try {
    payload = await verifySession(sessionCookie);
  } catch {
    throw new Error('Invalid or expired session');
  }

  const decodedToken: DecodedToken = {
    uid: payload.uid,
    email: payload.email,
    role: payload.role,
    exp: payload.exp,
  };

  if (skipUser) return { decodedToken, user: null };

  const dbUser = (await prisma.user.findUnique({
    where: { id: payload.uid },
  })) as dbUser | null;

  if (!dbUser) return { decodedToken, user: null };

  const user = rawToUser(dbUser);

  return { decodedToken, user };
};
// ----------- S3 R2 MIGRATION ----------- //

export const S3 = new S3Client({
  region: 'auto',
  endpoint: `https://49f11ef3296870a8f69b32f2d4555981.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
});

export const fileExists = async (path: string) => {
  try {
    await S3.send(new HeadObjectCommand({ Bucket: 'itemdb', Key: path }));
    return true;
  } catch (error: any) {
    console.error('Error checking file existence:', error.$metadata);
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
};

export const uploadToS3 = async (path: string, buffer: Buffer, contentType: string) => {
  const command = new PutObjectCommand({
    Bucket: 'itemdb',
    Key: path,
    Body: buffer,
    ContentType: contentType,
    ContentLength: buffer.length,
  });

  await S3.send(command);
};

export const deleteFromS3 = async (path: string) => {
  const command = new PutObjectCommand({
    Bucket: 'itemdb',
    Key: path,
  });

  await S3.send(command);
};

export async function cdnExists(path: string, includeHeader = false): Promise<boolean | string> {
  try {
    const response = await axios.head('https://cdn.itemdb.com.br/' + path, {
      validateStatus: () => true,
    });

    if (includeHeader) {
      return response.headers['last-modified'];
    }

    return response.status >= 200 && response.status < 300;
  } catch (error) {
    throw new Error(`Error checking CDN existence: ${error}`);
  }
}

// check everything inside a S3 "folder" (prefix) and return a list with their meta data
export async function getFolderMeta(path: string) {
  try {
    const response = await S3.send(
      new ListObjectsV2Command({
        Bucket: 'itemdb',
        Prefix: path,
      })
    );

    const metaList = response.Contents?.map((item) => ({
      Key: item.Key,
      LastModified: item.LastModified,
      Size: item.Size,
    }));

    return metaList ?? [];
  } catch (error) {
    console.error('Error listing folder meta:', error);
    throw new Error(`Error listing folder meta: ${error}`);
  }
}
