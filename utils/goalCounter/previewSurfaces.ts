// Preview surfaces only — they don't change the image, they show how it looks where it's pasted.
export const PREVIEW_BACKGROUNDS = {
  lookup: {
    backgroundImage: 'linear-gradient(135deg, #ffd8e8 0%, #fff3c4 35%, #c9f0ff 70%, #d9ccff 100%)',
  },
  light: { backgroundColor: '#ffffff' },
  dark: { backgroundColor: '#1f2129' },
} as const;

export type PreviewBackground = keyof typeof PREVIEW_BACKGROUNDS;
export const PREVIEW_BACKGROUND_KEYS = Object.keys(PREVIEW_BACKGROUNDS) as PreviewBackground[];
