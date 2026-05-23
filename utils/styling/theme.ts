import { createSystem, defaultConfig } from '@chakra-ui/react';
import { Inter } from 'next/font/google';
import {
  chakraV2ColorTokens,
  chakraV2SemanticColorTokens,
} from '@utils/styling/chakraV2ColorTokens';
import { badgeRecipe, buttonRecipe, inputRecipe } from '@utils/styling/recipes';

const inter = Inter({ subsets: ['latin'] });

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
    },
    recipes: {
      badge: badgeRecipe,
      input: inputRecipe,
      textarea: inputRecipe,
      button: buttonRecipe,
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
