'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { EmotionRegistry } from '@app/EmotionRegistry';
import { Toaster } from '@components/ui/toaster';
import { Provider } from 'jotai';
import type { ReactNode } from 'react';
import { system } from '@utils/theme/theme';
import { AuthProvider } from '@utils/auth';
import { installProofInterceptor } from '@utils/api/proofInterceptor';
import { ProgressProvider } from '@bprogress/next/app';

type ProvidersProps = {
  children: ReactNode;
};

if (typeof window !== 'undefined') {
  installProofInterceptor();
}

export function Providers({ children }: ProvidersProps) {
  return (
    <EmotionRegistry>
      <ChakraProvider value={system}>
        <Provider>
          <ProgressProvider color="#718096">
            <AuthProvider clientAuthSync={false}>
              {children}
              <Toaster />
            </AuthProvider>
          </ProgressProvider>
        </Provider>
      </ChakraProvider>
    </EmotionRegistry>
  );
}
