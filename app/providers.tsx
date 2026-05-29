'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { EmotionRegistry } from '@app/EmotionRegistry';
import { Toaster } from '@components/ui/toaster';
import { Provider } from 'jotai';
import type { ReactNode } from 'react';
import { system } from '@utils/theme/theme';
import { ColorModeProvider } from '@components/ui/color-mode';
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

export function Providers({ children, initialAuthState }: ProvidersProps) {
  return (
    <EmotionRegistry>
      <ChakraProvider value={system}>
        <ColorModeProvider>
          <Provider>
            {/* <Next13ProgressBar color="#718096" showOnShallow={true} /> */}
            <AuthProvider initialUser={initialAuthState?.user}>
              {children}
              <Toaster />
            </AuthProvider>
          </Provider>
        </ColorModeProvider>
      </ChakraProvider>
    </EmotionRegistry>
  );
}
