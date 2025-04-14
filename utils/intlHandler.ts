import { IntlError, IntlErrorCode } from 'next-intl';
import * as Sentry from '@sentry/nextjs';

export const onIntlError = (error: IntlError) => {
  if (error.code === IntlErrorCode.MISSING_MESSAGE) {
    console.error(error);
  }

  Sentry.captureException(error);
};
