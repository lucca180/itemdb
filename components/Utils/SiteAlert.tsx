'use client';

import { Link } from '@chakra-ui/react';
import { useLocale, useTranslations } from 'next-intl';
import MainLink from '@components/Utils/MainLink';
import { getCurrentSiteAlert } from '@utils/siteAlert';
import { getLocalizedHref, isLocalizableHref, type AppLocale } from '@utils/locales';
import { SiteAlertBar } from '@components/Layout/SiteAlertBar';

export const SiteAlert = () => {
  const t = useTranslations();
  const locale = useLocale() as AppLocale;
  const alert = getCurrentSiteAlert();
  const linkHref = isLocalizableHref(alert.link)
    ? getLocalizedHref(alert.link, locale)
    : alert.link;

  return (
    <SiteAlertBar alert={alert} linkHref={linkHref}>
      {!!alert.message &&
        t.rich(`SiteAlert.${alert.message}`, {
          b: (children) => <b>{children}</b>,
          Link: (children) => (
            <Link
              asChild
              fontWeight="bold"
              data-umami-event="site-alert-click"
              data-umami-event-label={alert.message}
              _hover={{ textDecoration: 'underline' }}
              color={alert.color}
            >
              <MainLink
                href={alert.link}
                target={isLocalizableHref(alert.link) ? undefined : '_blank'}
                isExternal={!isLocalizableHref(alert.link)}
              >
                {children}
              </MainLink>
            </Link>
          ),
        })}
    </SiteAlertBar>
  );
};
