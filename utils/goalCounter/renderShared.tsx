// Shared pieces for goal counter renderers (next/og). Satori only understands plain <img>.
/* eslint-disable @next/next/no-img-element */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ImageResponse } from 'next/og';
import { createCanvas, type Image } from '@napi-rs/canvas';
import { Vibrant } from 'node-vibrant/node';
import type { CSSProperties } from 'react';

export { GOAL_SIZES } from './config';

// ---------- static assets ---------- //

const publicFile = (...p: string[]) => readFile(path.join(process.cwd(), 'public', ...p));

type Fonts = NonNullable<ConstructorParameters<typeof ImageResponse>[1]>['fonts'];

let fontsPromise: Promise<Fonts>;
export const getFonts = () =>
  (fontsPromise ??= Promise.all([
    publicFile('fonts', 'Silkscreen-Regular.ttf'),
    publicFile('fonts', 'Silkscreen-Bold.ttf'),
    publicFile('fonts', 'PixelifySans-Bold.ttf'),
    publicFile('fonts', 'PressStart2P-Regular.ttf'),
  ]).then(([silk, silkBold, pixelify, pressStart]) => [
    { name: 'Silkscreen', data: silk, weight: 400 as const, style: 'normal' as const },
    { name: 'Silkscreen', data: silkBold, weight: 700 as const, style: 'normal' as const },
    { name: 'Pixelify', data: pixelify, weight: 700 as const, style: 'normal' as const },
    { name: 'PressStart2P', data: pressStart, weight: 400 as const, style: 'normal' as const },
  ]));

let iconPromise: Promise<string>;
/** itemdb logo (hand truck) as a data URI */
export const getIcon = () =>
  (iconPromise ??= publicFile('logo_icon.svg').then(
    (svg) => `data:image/svg+xml;base64,${svg.toString('base64')}`
  ));

// ---------- image prep (GIF -> PNG; next/og can't draw GIFs) ---------- //

export const pngUri = (buf: Buffer) => `data:image/png;base64,${buf.toString('base64')}`;

export const fetchBuffer = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
};

export const drawScaled = (img: Image, size: number) => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, size, size);
  return canvas;
};

export type Palette = { ink: string; accent: string; light: string };

export async function getPalette(buf: Buffer, source: string): Promise<Palette> {
  const fallback = { ink: '#555555', accent: '#888888', light: '#cccccc' };
  try {
    const p = await Vibrant.from(buf).getPalette();
    return {
      ink: p.DarkVibrant?.hex ?? p.DarkMuted?.hex ?? p.Muted?.hex ?? fallback.ink,
      accent: p.Vibrant?.hex ?? p.LightVibrant?.hex ?? p.Muted?.hex ?? fallback.accent,
      light: p.LightVibrant?.hex ?? p.LightMuted?.hex ?? p.Vibrant?.hex ?? fallback.light,
    };
  } catch (e) {
    console.error('[goal-counter] palette failed', source, e);
    return fallback;
  }
}

// ---------- colors ---------- //

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (c: number[]) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');

/** Mixes a color toward white (k = 0..1). */
export const tint = (hex: string, k: number) =>
  toHex(rgb(hex).map((v) => Math.round(v + (255 - v) * k)));

/** Darkens a color until it reads on a light background. */
export const readableOnLight = (hex: string) => {
  let c = rgb(hex);
  const lum = () => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
  while (lum() > 0.42) c = c.map((v) => Math.round(v * 0.82));
  return toHex(c);
};

// ---------- building blocks ---------- //

export const stroke = (color = '#fff'): CSSProperties => ({ WebkitTextStroke: `1px ${color}` });

/** Number font (Press Start 2P), which is large for its nominal size. */
export const pressStart = (size: number): CSSProperties => ({
  fontFamily: 'PressStart2P',
  fontWeight: 400,
  fontSize: Math.round(size * 0.85),
  lineHeight: 1,
  whiteSpace: 'nowrap',
});

/** itemdb icon + "itemdb". `light` = white text (on dark/ink surfaces), otherwise ink + outline. */
export const BrandMark = ({
  icon,
  ink,
  light,
  outline = true,
}: {
  icon: string;
  ink: string;
  light?: boolean;
  outline?: boolean;
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 15 }}>
    <img alt="" src={icon} width={13} height={13} />
    <div
      style={{
        display: 'flex',
        fontFamily: 'Pixelify',
        fontWeight: 700,
        fontSize: 9,
        lineHeight: 1,
        marginTop: 1,
        color: light ? '#ffffff' : ink,
        ...(light || !outline ? {} : stroke()),
      }}
    >
      itemdb
    </div>
  </div>
);

/**
 * Classic layout shared by stamps and collections: icon on the left; title, progress bar
 * (ticks every 25%) and "owned/target" + brand on the right.
 * `iconFrame` draws a white frame around the icon (off for stamp avatars, which have their own).
 */
export const ClassicCounter = ({
  size,
  icon,
  iconSize,
  iconFrame = true,
  brandIcon,
  title,
  owned,
  target,
  showNumber,
  card,
  palette,
}: {
  size: [number, number];
  icon: string;
  iconSize: number;
  iconFrame?: boolean;
  brandIcon: string;
  title: string;
  owned: number;
  target: number;
  showNumber: boolean;
  card: boolean;
  palette: Palette;
}) => {
  const { ink, accent, light } = palette;
  const outline = card ? {} : stroke();
  const barW = 112;
  const pct = target > 0 ? Math.min(1, owned / target) : 0;

  return (
    <div
      style={{
        display: 'flex',
        width: size[0],
        height: size[1],
        alignItems: 'center',
        ...(card ? { background: '#ffffff', border: `1px solid ${ink}`, borderRadius: 6 } : {}),
      }}
    >
      <div
        style={{
          display: 'flex',
          marginLeft: card ? 3 : 1,
          ...(iconFrame
            ? {
                width: iconSize + 2,
                height: iconSize + 2,
                borderRadius: 6,
                overflow: 'hidden',
                border: `1px solid ${ink}`,
                background: '#ffffff',
              }
            : { width: iconSize, height: iconSize }),
        }}
      >
        <img alt="" src={icon} width={iconSize} height={iconSize} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 5, width: barW }}>
        <div
          style={{
            display: 'flex',
            fontFamily: 'Silkscreen',
            fontSize: 7,
            lineHeight: 1,
            height: 9,
            alignItems: 'flex-end',
            color: ink,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            ...outline,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: 'flex',
            position: 'relative',
            width: barW,
            height: 11,
            marginTop: 2,
            borderRadius: 3,
            border: `1px solid ${ink}`,
            background: card ? tint(light, 0.75) : 'rgba(255,255,255,.85)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: Math.round((barW - 2) * pct),
              height: 9,
              background: accent,
            }}
          >
            <div style={{ display: 'flex', height: 3, background: 'rgba(255,255,255,.35)' }} />
          </div>
          {[0.25, 0.5, 0.75].map((p) => (
            <div
              key={p}
              style={{
                display: 'flex',
                position: 'absolute',
                left: Math.round(barW * p) - 1,
                top: 0,
                width: 1,
                height: 9,
                background: 'rgba(0,0,0,.18)',
              }}
            />
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 2,
          }}
        >
          {showNumber ? (
            <div style={{ display: 'flex', ...pressStart(8), color: ink, ...outline }}>
              {`${owned}/${target}`}
            </div>
          ) : (
            <div style={{ display: 'flex' }} />
          )}
          <BrandMark icon={brandIcon} ink={ink} />
        </div>
      </div>
    </div>
  );
};
