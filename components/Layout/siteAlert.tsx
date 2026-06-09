import { getTranslations } from 'next-intl/server';
import { getCurrentSiteAlert } from '@utils/siteAlert';
import { getLocalizedHref, isLocalizableHref, type AppLocale } from '@utils/locales';
import { cacheLife } from 'next/cache';
import { SiteAlertBar } from './SiteAlertBar';

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
