import { defineConfig } from '@pandacss/dev';

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  strictTokens: true,

  prefix: 'panda',

  presets: ['@chakra-ui/panda-preset'],

  // Where to look for your css declarations
  include: ['./app/**/*.{js,jsx,ts,tsx}'],

  // Files to exclude
  exclude: [],

  // Useful for theme customization
  theme: {
    extend: {},
  },

  jsxFramework: 'react',

  // The output directory for your css system
  outdir: 'styled-system',
});
