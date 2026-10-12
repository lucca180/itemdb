import type { ReactNode } from 'react';
import { AppScripts } from '@app/AppScripts';
import { Providers } from '@app/providers';
import { inter } from '@utils/theme/fonts';
import '@utils/global.css';

type AppDocumentProps = {
  locale: string;
  children: ReactNode;
};

export function AppDocument({ locale, children }: AppDocumentProps) {
  return (
    <html
      lang={locale}
      className={`${inter.className} dark`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <body>
        <AppScripts />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
