import { createSystem, defaultConfig } from '@chakra-ui/react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      fonts: {
        body: { value: inter.style.fontFamily },
        heading: { value: inter.style.fontFamily },
      },
    },
  },
});
