import { defineConfig } from '@pandacss/dev';

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  prefix: 'panda',

  presets: ['@chakra-ui/panda-preset'],

  // Where to look for your css declarations
  include: ['./app/**/*.{js,jsx,ts,tsx}'],

  // Files to exclude
  exclude: [],

  // Useful for theme customization
  theme: {
    extend: {
      tokens: {
        colors: {
          gray: {
            50: { value: '#F7FAFC' },
            100: { value: '#EDF2F7' },
            200: { value: '#E2E8F0' },
            300: { value: '#CBD5E0' },
            400: { value: '#A0AEC0' },
            500: { value: '#718096' },
            600: { value: '#4A5568' },
            700: { value: '#2D3748' },
            800: { value: '#1A202C' },
            900: { value: '#171923' },
            950: { value: '#171923' },
          },
        },
      },
    },
  },

  jsxFramework: 'react',

  // The output directory for your css system
  outdir: 'styled-system',
});
