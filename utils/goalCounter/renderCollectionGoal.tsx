// next/og (Satori) only understands plain <img>; next/image does not apply here.
import { ImageResponse } from 'next/og';
import { loadImage } from '@napi-rs/canvas';
import { normalizeGoalConfig, type GoalConfig } from './config';
import type { CollectionGoalData } from './collectionGoalData';
import {
  ClassicCounter,
  GOAL_SIZES,
  drawScaled,
  fetchBuffer,
  getFonts,
  getIcon,
  getPalette,
  pngUri,
  readableOnLight,
} from './renderShared';

async function prepareImage(url: string, size: number) {
  const buf = await fetchBuffer(url);
  return { buf, uri: pngUri(drawScaled(await loadImage(buf), size).toBuffer('image/png')) };
}

export async function renderCollectionGoal(
  data: CollectionGoalData,
  config: GoalConfig
): Promise<Buffer> {
  const normalized = normalizeGoalConfig(config);
  const variant = normalized.variant;
  if (variant !== 'classic') {
    throw new Error(`Not a collection goal variant: ${variant}`);
  }

  const [fonts, brandIcon, icon] = await Promise.all([
    getFonts(),
    getIcon(),
    prepareImage(data.iconImage, 96),
  ]);
  const palette = await getPalette(icon.buf, data.iconImage);

  const size = GOAL_SIZES[variant];
  const res = new ImageResponse(
    <ClassicCounter
      size={size}
      icon={icon.uri}
      iconSize={40}
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
