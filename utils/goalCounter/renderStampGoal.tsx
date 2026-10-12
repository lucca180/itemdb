// next/og (Satori) only understands plain <img>; next/image does not apply here.
/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import type { CSSProperties, ReactElement } from 'react';
import { isStampVariant, normalizeGoalConfig, type GoalConfig, type StampVariant } from './config';
import { STAMPS_PER_PAGE, countBits, type StampGoalData } from './stampGoalData';
import {
  ClassicCounter,
  GOAL_SIZES,
  drawScaled,
  fetchBuffer,
  getFonts,
  getIcon,
  getPalette,
  pngUri,
  pressStart,
  readableOnLight,
  stroke,
  type Palette,
} from './renderShared';

const PAPER = '#f6efe0';
const CLEAR = 'rgba(0,0,0,0)';

type AvatarAssets = {
  color: string;
  gray: string;
  tiles: { on: string; off: string }[];
  ink: string;
  palette: Palette;
};

async function prepareAvatar(url: string): Promise<AvatarAssets> {
  const buf = await fetchBuffer(url);
  const img = await loadImage(buf);

  const color = drawScaled(img, 50);
  const gray = drawScaled(img, 50);
  const gctx = gray.getContext('2d');
  const data = gctx.getImageData(0, 0, 50, 50);
  for (let i = 0; i < data.data.length; i += 4) {
    const lum = 0.299 * data.data[i] + 0.587 * data.data[i + 1] + 0.114 * data.data[i + 2];
    const v = Math.min(255, Math.round(lum * 0.5 + 118));
    data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
  }
  gctx.putImageData(data, 0, 0);

  const tile = (src: typeof color, i: number) => {
    const c = createCanvas(10, 10);
    c.getContext('2d').drawImage(src, (i % 5) * 10, Math.floor(i / 5) * 10, 10, 10, 0, 0, 10, 10);
    return pngUri(c.toBuffer('image/png'));
  };

  const palette = await getPalette(buf, url);

  return {
    color: pngUri(color.toBuffer('image/png')),
    gray: pngUri(gray.toBuffer('image/png')),
    tiles: Array.from({ length: STAMPS_PER_PAGE }, (_, i) => ({
      on: tile(color, i),
      off: tile(gray, i),
    })),
    ink: palette.ink,
    palette,
  };
}

async function prepareStampThumbs(stamps: StampGoalData['stamps']) {
  const thumbs = new Map<number, string>();
  await Promise.all(
    stamps.map(async ({ pos, image }) => {
      if (!image) return;
      try {
        thumbs.set(
          pos,
          pngUri(drawScaled(await loadImage(await fetchBuffer(image)), 10).toBuffer('image/png'))
        );
      } catch (e) {
        console.error('[goal-counter] stamp image failed', image, e);
      }
    })
  );
  return thumbs;
}

// ---------- building blocks ---------- //

type Ctx = {
  data: StampGoalData;
  avatar: AvatarAssets;
  thumbs: Map<number, string>;
  icon: string;
  paper: boolean;
  showNumber: boolean;
};

const owns = (ctx: Ctx, pos: number) => (ctx.data.ownedMask & (1 << (pos - 1))) !== 0;

const Brand = ({ ctx, light }: { ctx: Ctx; light?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 15 }}>
    <img alt="" src={ctx.icon} width={13} height={13} />
    <div
      style={{
        display: 'flex',
        fontFamily: 'Pixelify',
        fontWeight: 700,
        fontSize: 9,
        lineHeight: 1,
        marginTop: 1,
        color: light ? '#ffffff' : ctx.avatar.ink,
        ...(light ? {} : stroke()),
      }}
    >
      itemdb
    </div>
  </div>
);

const CountPill = ({ ctx }: { ctx: Ctx }) => (
  <div
    style={{
      display: 'flex',
      ...pressStart(8),
      color: '#fff',
      background: ctx.avatar.ink,
      padding: '1px 4px 2px',
      borderRadius: 4,
      border: '1px solid #fff',
    }}
  >
    {`${ctx.data.ownedCount}/${STAMPS_PER_PAGE}`}
  </div>
);

// paper: plain text on the card; transparent: one ink pill so it reads on any background
const CountColumn = ({ ctx }: { ctx: Ctx }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: 30,
      ...(ctx.paper
        ? {}
        : {
            padding: '4px 0 3px',
            background: ctx.avatar.ink,
            borderRadius: 4,
            border: '1px solid #fff',
          }),
    }}
  >
    <div
      style={{
        display: 'flex',
        ...pressStart(12),
        color: ctx.paper ? ctx.avatar.ink : '#fff',
      }}
    >
      {String(ctx.data.ownedCount)}
    </div>
    <div
      style={{
        display: 'flex',
        ...pressStart(7),
        marginTop: 3,
        color: ctx.paper ? '#7a6a4f' : 'rgba(255,255,255,.8)',
      }}
    >
      {`/${STAMPS_PER_PAGE}`}
    </div>
  </div>
);

const Avatar = ({ ctx }: { ctx: Ctx }) => (
  <img alt="" src={ctx.avatar.color} width={50} height={50} />
);

const MosaicGrid = ({ ctx }: { ctx: Ctx }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 1, width: 54, height: 54 }}>
    {ctx.avatar.tiles.map((t, i) => (
      <img key={i} alt="" src={owns(ctx, i + 1) ? t.on : t.off} width={10} height={10} />
    ))}
  </div>
);

const RevealAvatar = ({ ctx }: { ctx: Ctx }) => {
  const filled = Math.round((50 * ctx.data.ownedCount) / STAMPS_PER_PAGE);
  const partial = ctx.data.ownedCount > 0 && ctx.data.ownedCount < STAMPS_PER_PAGE;
  return (
    <div style={{ display: 'flex', position: 'relative', width: 50, height: 50 }}>
      <img
        alt=""
        src={ctx.avatar.gray}
        width={50}
        height={50}
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: 50,
          height: filled,
          overflow: 'hidden',
        }}
      >
        <img
          alt=""
          src={ctx.avatar.color}
          width={50}
          height={50}
          style={{ position: 'absolute', bottom: 0, left: 0 }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: Math.max(filled - 1, 0),
          height: partial ? 1 : 0,
          background: '#fff',
        }}
      />
    </div>
  );
};

const PageGrid = ({ ctx }: { ctx: Ctx }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 1, width: 54, height: 54 }}>
    {Array.from({ length: STAMPS_PER_PAGE }, (_, i) => {
      const pos = i + 1;
      const thumb = ctx.thumbs.get(pos);
      if (owns(ctx, pos) && thumb)
        return <img key={pos} alt="" src={thumb} width={10} height={10} />;
      return (
        <div
          key={pos}
          style={{
            display: 'flex',
            width: 10,
            height: 10,
            border: `1px dashed ${ctx.paper ? '#b9a98a' : 'rgba(128,128,128,.8)'}`,
            background: owns(ctx, pos)
              ? ctx.avatar.ink
              : ctx.paper
                ? '#ece2cc'
                : 'rgba(128,128,128,.18)',
          }}
        />
      );
    })}
  </div>
);

// ---------- variants ---------- //

const BrandOnTop = ({
  ctx,
  visual,
  size,
}: {
  ctx: Ctx;
  visual: ReactElement;
  size: [number, number];
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: size[0],
      height: size[1],
    }}
  >
    <div style={{ display: 'flex', marginTop: 1, marginBottom: 2 }}>
      <Brand ctx={ctx} />
    </div>
    {visual}
    <div style={{ display: 'flex', marginTop: 2 }}>
      <CountPill ctx={ctx} />
    </div>
  </div>
);

const pageFrame = (ctx: Ctx, w: number, h: number): CSSProperties => ({
  display: 'flex',
  width: w,
  height: h,
  background: ctx.paper ? PAPER : CLEAR,
  borderRadius: 4,
  border: `1px solid ${ctx.paper ? ctx.avatar.ink : CLEAR}`,
});

const VARIANTS: Record<StampVariant, (ctx: Ctx) => ReactElement> = {
  'stamp-classic': (ctx) => (
    <ClassicCounter
      size={GOAL_SIZES['stamp-classic']}
      icon={ctx.avatar.color}
      iconSize={50}
      iconFrame={false}
      brandIcon={ctx.icon}
      title={ctx.data.title}
      owned={ctx.data.ownedCount}
      target={STAMPS_PER_PAGE}
      showNumber={ctx.showNumber}
      card={ctx.paper}
      // ink is used for text on white/light surfaces
      palette={{ ...ctx.avatar.palette, ink: readableOnLight(ctx.avatar.palette.ink) }}
    />
  ),

  mosaic: (ctx) => (
    <BrandOnTop ctx={ctx} visual={<MosaicGrid ctx={ctx} />} size={GOAL_SIZES.mosaic} />
  ),

  reveal: (ctx) => (
    <BrandOnTop ctx={ctx} visual={<RevealAvatar ctx={ctx} />} size={GOAL_SIZES.reveal} />
  ),

  'page-header': (ctx) => (
    <div style={{ ...pageFrame(ctx, 150, 76), flexDirection: 'column', overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          height: 17,
          alignItems: 'center',
          justifyContent: 'center',
          background: ctx.avatar.ink,
          borderRadius: ctx.paper ? 0 : 4,
        }}
      >
        <Brand ctx={ctx} light />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', height: 57 }}>
        <div style={{ display: 'flex', marginLeft: 3 }}>
          <Avatar ctx={ctx} />
        </div>
        <div style={{ display: 'flex', marginLeft: 4 }}>
          <PageGrid ctx={ctx} />
        </div>
        <div style={{ display: 'flex', marginLeft: 3 }}>
          <CountColumn ctx={ctx} />
        </div>
      </div>
    </div>
  ),

  'page-value': (ctx) => (
    <div style={{ ...pageFrame(ctx, 152, 60), alignItems: 'center' }}>
      <div style={{ display: 'flex', marginLeft: 3 }}>
        <Avatar ctx={ctx} />
      </div>
      <div style={{ display: 'flex', marginLeft: 4 }}>
        <PageGrid ctx={ctx} />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 32,
          height: 54,
          marginLeft: 3,
          marginRight: 3,
          padding: '2px 0 3px',
          borderRadius: 4,
          // integer width: fractional borders render unevenly
          border: `2px solid ${ctx.avatar.ink}`,
          background: ctx.paper ? '#fffaf0' : ctx.avatar.ink,
        }}
      >
        <img alt="" src={ctx.icon} width={13} height={13} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              ...pressStart(12),
              color: ctx.paper ? ctx.avatar.ink : '#fff',
            }}
          >
            {String(ctx.data.ownedCount)}
          </div>
          <div
            style={{
              display: 'flex',
              ...pressStart(7),
              marginTop: 2,
              color: ctx.paper ? '#7a6a4f' : 'rgba(255,255,255,.75)',
            }}
          >
            {`/${STAMPS_PER_PAGE}`}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            fontFamily: 'Pixelify',
            fontWeight: 700,
            fontSize: 7,
            lineHeight: 1,
            color: ctx.paper ? ctx.avatar.ink : '#fff',
          }}
        >
          itemdb
        </div>
      </div>
    </div>
  ),

  'page-legend': (ctx) => {
    const line: CSSProperties = {
      display: 'flex',
      position: 'absolute',
      background: ctx.avatar.ink,
    };
    return (
      <div style={{ display: 'flex', position: 'relative', width: 152, height: 72 }}>
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            left: 1,
            top: 1,
            width: 150,
            height: 64,
            background: ctx.paper ? PAPER : CLEAR,
            borderRadius: 3,
          }}
        />
        {/* 2px lines on integer pixels; fractional ones get rounded unevenly per side */}
        <div style={{ ...line, left: 1, top: 1, width: 150, height: 2 }} />
        <div style={{ ...line, left: 1, top: 1, width: 2, height: 64 }} />
        <div style={{ ...line, left: 149, top: 1, width: 2, height: 64 }} />
        <div style={{ ...line, left: 1, top: 63, width: 76, height: 2 }} />
        <div style={{ ...line, left: 144, top: 63, width: 7, height: 2 }} />
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            left: 79,
            top: 57,
            width: 63,
            height: 15,
            justifyContent: 'center',
          }}
        >
          <Brand ctx={ctx} />
        </div>
        <div
          style={{ display: 'flex', position: 'absolute', left: 5, top: 4, alignItems: 'center' }}
        >
          <Avatar ctx={ctx} />
          <div style={{ display: 'flex', marginLeft: 4 }}>
            <PageGrid ctx={ctx} />
          </div>
          <div style={{ display: 'flex', marginLeft: 3 }}>
            <CountColumn ctx={ctx} />
          </div>
        </div>
      </div>
    );
  },
};

// ---------- entry point ---------- //

export async function renderStampGoal(data: StampGoalData, config: GoalConfig): Promise<Buffer> {
  const normalized = normalizeGoalConfig(config);
  const { variant } = normalized;
  if (!isStampVariant(variant)) throw new Error(`Not a stamp goal variant: ${variant}`);
  const needsThumbs = variant.startsWith('page-');

  const [fonts, icon, avatar, thumbs] = await Promise.all([
    getFonts(),
    getIcon(),
    prepareAvatar(data.avatarImage),
    needsThumbs ? prepareStampThumbs(data.stamps) : Promise.resolve(new Map<number, string>()),
  ]);

  const ctx: Ctx = {
    data: { ...data, ownedCount: countBits(data.ownedMask) },
    avatar,
    thumbs,
    icon,
    paper: normalized.bg === 'paper',
    showNumber: normalized.showNumber,
  };

  const [width, height] = GOAL_SIZES[variant];
  const res = new ImageResponse(VARIANTS[variant](ctx), { width, height, fonts });

  return Buffer.from(await res.arrayBuffer());
}
