import { Bricolage_Grotesque, DM_Sans, Silkscreen } from 'next/font/google';

export const displayFont = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '800'] });
export const bodyFont = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700'] });
export const pixelFont = Silkscreen({ subsets: ['latin'], weight: '400' });

/** Slides are designed at this size (9:16) and scaled to fit; the share image is 1080x1920. */
export const SLIDE_WIDTH = 405;
export const SLIDE_HEIGHT = 720;

export const COLORS = {
  ink: '#0F1F18',
  panel: '#1B3328',
  lime: '#D2FF72',
  cream: '#F3F0E6',
  muted: '#C9C5B8',
  mutedDark: '#4A5A52',
  forest: '#2E5A3F',
  lossBg: '#1F1412',
  coral: '#FF8A65',
  heat: ['rgba(243, 240, 230, 0.08)', '#2E5A3F', '#4E8F5E', '#8FCB6B', '#D2FF72'],
};

export type SlideTheme = 'dark' | 'lime' | 'cream' | 'loss';

export const SLIDE_THEMES: Record<
  SlideTheme,
  {
    bg: string;
    fg: string;
    accent: string;
    muted: string;
    track: string;
    buttonBg: string;
    buttonFg: string;
  }
> = {
  dark: {
    bg: COLORS.ink,
    fg: COLORS.cream,
    accent: COLORS.lime,
    muted: COLORS.muted,
    track: 'rgba(243, 240, 230, 0.22)',
    buttonBg: COLORS.lime,
    buttonFg: COLORS.ink,
  },
  lime: {
    bg: COLORS.lime,
    fg: COLORS.ink,
    accent: COLORS.ink,
    muted: '#2E3F36',
    track: 'rgba(15, 31, 24, 0.2)',
    buttonBg: COLORS.ink,
    buttonFg: COLORS.lime,
  },
  cream: {
    bg: COLORS.cream,
    fg: COLORS.ink,
    accent: COLORS.forest,
    muted: COLORS.mutedDark,
    track: 'rgba(15, 31, 24, 0.18)',
    buttonBg: COLORS.ink,
    buttonFg: COLORS.lime,
  },
  loss: {
    bg: COLORS.lossBg,
    fg: COLORS.cream,
    accent: COLORS.coral,
    muted: COLORS.muted,
    track: 'rgba(243, 240, 230, 0.22)',
    buttonBg: COLORS.coral,
    buttonFg: COLORS.lossBg,
  },
};

export const shopkeeperImage = (shopId: number) =>
  `https://images.neopets.com/shopkeepers/w${shopId}.gif`;
