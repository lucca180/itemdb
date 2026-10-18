import type { ReactNode } from 'react';
import { AppScripts } from '@app/AppScripts';
import { inter } from '@utils/theme/fonts';
import '@utils/global.css';

type AppDocumentProps = {
  locale: string;
  children: ReactNode;
};

/**
 * html/body shell. Callers render `<Providers>` inside their intl provider (not here), so
 * AuthProvider and the global LoginModal can use translations.
 */
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
        {children}
      </body>
    </html>
  );
}
