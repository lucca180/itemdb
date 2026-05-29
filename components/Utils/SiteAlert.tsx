'use client';

import { Link } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';
import { getCurrentSiteAlert } from '@utils/siteAlert';
import { SiteAlertBar } from '@components/Layout/siteAlert';

export const SiteAlert = () => {
  const t = useTranslations();
  const alert = getCurrentSiteAlert();

  return (
    <SiteAlertBar alert={alert}>
      {!!alert.message &&
        t.rich(`SiteAlert.${alert.message}`, {
          b: (children) => <b>{children}</b>,
          Link: (children) => (
            <Link
              asChild
              fontWeight="bold"
              data-umami-event="site-alert-click"
              data-umami-event-label={alert.message}
            >
              <NextLink href={alert.link} target="_blank" rel="noreferrer">
                {children}
              </NextLink>
            </Link>
          ),
        })}
    </SiteAlertBar>
  );
};
