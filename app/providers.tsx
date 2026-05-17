'use client';

import { ChakraProvider, cookieStorageManager, cookieStorageManagerSSR } from '@chakra-ui/react';
import { Provider } from 'jotai';
import type { ReactNode } from 'react';
import theme from '@utils/theme';
import { AuthProvider } from '@utils/auth';
import { installProofInterceptor } from '@utils/http/proofInterceptor';
import type { PreloadedAuthState } from '@app/utils/preloadData';
// import { Next13ProgressBar } from 'next13-progressbar';

type ProvidersProps = {
  children: ReactNode;
  initialAuthState?: PreloadedAuthState;
};

if (typeof window !== 'undefined') {
  installProofInterceptor();
}

const colorModeManager =
  typeof window === 'undefined'
    ? cookieStorageManagerSSR('chakra-ui-color-mode=dark')
    : cookieStorageManager;

export function Providers({ children, initialAuthState }: ProvidersProps) {
  return (
    <ChakraProvider theme={theme} colorModeManager={colorModeManager} resetCSS={false}>
      <Provider>
        {/* <Next13ProgressBar color="#718096" showOnShallow={true} /> */}
        <AuthProvider initialUser={initialAuthState?.user}>{children}</AuthProvider>
      </Provider>
    </ChakraProvider>
  );
}
