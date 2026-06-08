'use client';

import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import type { AbstractIntlMessages } from 'next-intl';
import { onIntlError } from '@utils/intlHandler';

type IntlProviderProps = {
  children: ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
};

export function IntlProvider({ children, locale, messages }: IntlProviderProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="America/Los_Angeles"
      onError={(error) => onIntlError(error, {})}
    >
      {children}
    </NextIntlClientProvider>
  );
}
