// next/og (Satori) only understands plain <img>; next/image does not apply here.
import { ImageResponse } from 'next/og';
import { loadImage } from '@napi-rs/canvas';
import { normalizeGoalConfig, type GoalConfig } from './config';
import type { CollectionGoalData } from './collectionGoalData';
import { GOAL_COLLECTIONS } from './collections';
import {
  ClassicCounter,
  GOAL_SIZES,
  drawScaled,
  getFonts,
  getIcon,
  getPalette,
  loadImageBuffer,
  pngUri,
  readableOnLight,
} from './renderShared';

async function prepareImage(url: string, size: number) {
  const buf = await loadImageBuffer(url);
  return { buf, uri: pngUri(drawScaled(await loadImage(buf), size).toBuffer('image/png')) };
}

export async function renderCollectionGoal(
  data: CollectionGoalData,
  config: GoalConfig
): Promise<Buffer> {
  const normalized = normalizeGoalConfig(config);
  const variant = normalized.variant;
  if (variant !== 'classic' && variant !== 'classic-trophy') {
    throw new Error(`Not a collection goal variant: ${variant}`);
  }

  // a collection without a trophy (Stamp Collector: its icon already is one) keeps its icon
  const collection = GOAL_COLLECTIONS[data.collection];
  const trophy = variant === 'classic-trophy' ? collection.trophy : undefined;
  const iconImage = trophy ?? data.iconImage;

  const [fonts, brandIcon, icon] = await Promise.all([
    getFonts(),
    getIcon(),
    prepareImage(iconImage, 96),
  ]);
  const palette = await getPalette(icon.buf, iconImage);

  const size = GOAL_SIZES[variant];
  const res = new ImageResponse(
    <ClassicCounter
      size={size}
      icon={icon.uri}
      iconSize={40}
      iconFrame={trophy ? false : (collection.iconFrame ?? true)}
      brandIcon={brandIcon}
      title={data.title}
      owned={data.owned}
      target={normalized.target ?? data.total}
      showNumber={normalized.showNumber}
      card={normalized.bg === 'paper'}
      // ink is used for text on white/light surfaces
      palette={{ ...palette, ink: readableOnLight(palette.ink) }}
    />,
    { width: size[0], height: size[1], fonts }
  );
  return Buffer.from(await res.arrayBuffer());
}
