import { createSystem, defaultConfig, defineRecipe } from '@chakra-ui/react';
import { Inter } from 'next/font/google';
import { chakraV2ColorTokens, chakraV2SemanticColorTokens } from '@utils/theme/chakraV2ColorTokens';
import {
  badgeRecipe,
  buttonRecipe,
  inputRecipe,
  nativeSelectRecipe,
  switchRecipe,
} from '@utils/theme/recipes';

const inter = Inter({ subsets: ['latin'] });

const headingRecipe = defineRecipe({
  base: {
    fontFamily: 'heading',
    fontWeight: 'bold',
  },
  variants: {
    size: {
      xs: {
        fontSize: 'sm',
        lineHeight: 1.2,
      },
      sm: {
        fontSize: 'md',
        lineHeight: 1.2,
      },
      md: {
        fontSize: 'xl',
        lineHeight: 1.2,
      },
      lg: {
        fontSize: ['2xl', null, '3xl'],
        lineHeight: [1.33, null, 1.2],
      },
      xl: {
        fontSize: ['3xl', null, '4xl'],
        lineHeight: [1.33, null, 1.2],
      },
      '2xl': {
        fontSize: ['4xl', null, '5xl'],
        lineHeight: [1.2, null, 1],
      },
      '3xl': {
        fontSize: ['5xl', null, '6xl'],
        lineHeight: 1,
      },
      '4xl': {
        fontSize: ['6xl', null, '7xl'],
        lineHeight: 1,
      },
      '5xl': {
        textStyle: '5xl',
      },
      '6xl': {
        textStyle: '6xl',
      },
      '7xl': {
        textStyle: '7xl',
      },
    },
  },
  defaultVariants: {
    size: 'xl',
  },
});

export const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      fonts: {
        body: { value: inter.style.fontFamily },
        heading: { value: inter.style.fontFamily },
      },
      colors: chakraV2ColorTokens,
    },
    semanticTokens: {
      colors: chakraV2SemanticColorTokens,
      shadows: {
        sm: { value: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);' },
      },
    },
    recipes: {
      badge: badgeRecipe,
      heading: headingRecipe,
      input: inputRecipe,
      textarea: inputRecipe,
      button: buttonRecipe,
    },
    slotRecipes: {
      nativeSelect: nativeSelectRecipe,
      switch: switchRecipe,
    },
  },
  globalCss: {
    html: {
      colorScheme: 'dark',
    },
    body: {
      bg: 'bg',
      color: 'fg',
    },
    '*::placeholder': {
      color: { _light: '{colors.gray.500}', _dark: '{colors.whiteAlpha.400}' },
    },
    '*, *::before, *::after': {
      borderColor: 'border',
    },
  },
});
