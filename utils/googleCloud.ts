import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';
import type { NextApiRequest } from 'next';
import prisma from './prisma';
import { Storage } from '@google-cloud/storage';
import { User as dbUser } from '@prisma/generated/client';
import { rawToUser } from '../pages/api/auth/login';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';

if (!getApps().length) initializeApp({ credential: cert('./firebase-key.json') });

export const Auth = getAuth();

export const CheckAuth = async (
  req: NextApiRequest | null,
  token?: string,
  session?: string,
  skipUser = false
) => {
  token = token || req?.headers.authorization?.split('Bearer ')[1];

  let decodedToken: DecodedIdToken;
  try {
    if (!token) throw new Error('No token provided');
    decodedToken = await Auth.verifyIdToken(token);
  } catch (err) {
    if ((!req || !req.cookies.session) && !session) throw err;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    decodedToken = await Auth.verifySessionCookie((session ?? req?.cookies.session)!);
  }

  if (skipUser) return { decodedToken: decodedToken, user: null };

  const dbUser = (await prisma.user.findUnique({
    where: { id: decodedToken.uid, email: decodedToken.email },
  })) as dbUser | null;

  if (!dbUser) return { decodedToken: decodedToken, user: null };

  const user = rawToUser(dbUser);

  return {
    decodedToken: decodedToken,
    user: user,
  };
};

export const GoogleStorage = new Storage({
  keyFilename: './firebase-key.json',
});

export const ImageBucket = GoogleStorage.bucket('itemdb-1db58.appspot.com');

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

export async function cdnExists(path: string): Promise<boolean> {
  try {
    const response = await axios.head('https://cdn.itemdb.com.br/' + path, {
      validateStatus: () => true,
    });
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    throw new Error(`Error checking CDN existence: ${error}`);
  }
}
