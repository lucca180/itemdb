import type { ReactNode } from 'react';
import { Flex, Text } from '@chakra-ui/react';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { getCurrentSiteAlert, siteAlerts } from '@utils/siteAlert';
import type { SiteAlertConfig } from '@utils/siteAlert';
import { getLocalizedHref, isLocalizableHref, type AppLocale } from '@utils/locales';
import { cacheLife } from 'next/cache';

export async function getCachedSiteAlert() {
  'use cache';
  cacheLife('seconds');
  return getCurrentSiteAlert();
}

function getAlertHref(link: string, locale: AppLocale) {
  if (!isLocalizableHref(link)) {
    return link;
  }

  return getLocalizedHref(link, locale);
}

type SiteAlertProps = {
  alert?: SiteAlertConfig;
  children?: ReactNode;
  linkHref?: string;
};

export function SiteAlertBar({ alert, children, linkHref }: SiteAlertProps) {
  alert = alert || siteAlerts.default;
  const href = linkHref ?? alert.link;
  const isExternal = !isLocalizableHref(href);

  return (
    <Flex bg={alert.bg}>
      <Flex
        w="full"
        maxW="8xl"
        marginX="auto"
        alignItems="center"
        gap={1}
        fontSize="xs"
        minH="30px"
        px={1}
      >
        {alert.img && (
          <a
            href={href}
            style={{ display: 'inline-flex' }}
            data-umami-event="site-alert-click"
            data-umami-event-label={alert.message}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
          >
            <Image src={alert.img.src} width={alert.img.w} height={alert.img.h} alt="alert icon" />
          </a>
        )}

        <Text as="p" color={alert.color}>
          {children}
        </Text>
      </Flex>
    </Flex>
  );
}

type AppSiteAlertProps = {
  locale: string;
};

export async function AppSiteAlert({ locale }: AppSiteAlertProps) {
  const [t, alert] = await Promise.all([getTranslations({ locale }), getCachedSiteAlert()]);

  const appLocale = locale as AppLocale;

  const linkHref = getAlertHref(alert.link, appLocale);

  const isExternal = !isLocalizableHref(linkHref);

  return (
    <SiteAlertBar alert={alert} linkHref={linkHref}>
      {!!alert.message &&
        t.rich(`SiteAlert.${alert.message}`, {
          b: (children) => <b>{children}</b>,

          Link: (children) => (
            <a
              href={linkHref}
              style={{ fontWeight: 'bold' }}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              data-umami-event="site-alert-click"
              data-umami-event-label={alert.message}
            >
              {children}
            </a>
          ),
        })}
    </SiteAlertBar>
  );
}
