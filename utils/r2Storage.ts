import {
  S3Client,
  PutObjectCommand,
  CopyObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import axios from 'axios';

// R2/S3 storage helpers only — deliberately independent of auth/prisma/redis (utils/googleCloud.ts
// re-exports this module) so standalone scripts can use them without pulling in an ioredis
// connection attempt via utils/auth/userCache.ts.

export const DUMPS_BUCKET = 'dumps';
const DEFAULT_BUCKET = 'itemdb';
const DUMP_SIGNED_URL_EXPIRES_IN = 600;

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

export const fileExists = async (path: string, bucket = DEFAULT_BUCKET) => {
  try {
    await S3.send(new HeadObjectCommand({ Bucket: bucket, Key: path }));
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

export const copyS3Object = async (fromPath: string, toPath: string) => {
  await S3.send(
    new CopyObjectCommand({
      Bucket: 'itemdb',
      CopySource: `itemdb/${fromPath}`,
      Key: toPath,
    })
  );
};

export const deleteFromS3 = async (path: string) => {
  const command = new PutObjectCommand({
    Bucket: 'itemdb',
    Key: path,
  });

  await S3.send(command);
};

export async function cdnExists(path: string, includeHeader = false): Promise<boolean | string> {
  if (path.includes('..')) return false;

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

export async function getDumpSignedUrl(key: string, filename?: string): Promise<string> {
  const downloadName = filename || key.split('/').pop() || key;
  const command = new GetObjectCommand({
    Bucket: DUMPS_BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${downloadName}"`,
  });

  return getSignedUrl(S3, command, { expiresIn: DUMP_SIGNED_URL_EXPIRES_IN });
}

// check everything inside a S3 "folder" (prefix) and return a list with their meta data
export async function getFolderMeta(path: string, bucket = DEFAULT_BUCKET) {
  try {
    const response = await S3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
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
