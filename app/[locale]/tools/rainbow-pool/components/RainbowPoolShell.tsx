import { Box } from '@chakra-ui/react';
import type { ReactNode } from 'react';

export const MAIN_COLOR = '#75b6a48c';
export const THEME_RGB = [117, 182, 164] as const;
export const BASE_PATH = '/tools/rainbow-pool' as const;

type RainbowPoolShellProps = {
  children: ReactNode;
};

export function RainbowPoolShell({ children }: RainbowPoolShellProps) {
  const [r, g, b] = THEME_RGB;

  return (
    <>
      <Box
        position="absolute"
        h="650px"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${r},${g},${b},0.9) 70%)`}
        zIndex={-1}
      />
      {children}
    </>
  );
}
