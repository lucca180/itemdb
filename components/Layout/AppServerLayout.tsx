import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { AppSiteAlert, SiteAlertBar } from '@components/Layout/siteAlert';
import { AuthButtonSkeleton } from '@components/Layout/AuthButtonSkeleton';
import { LayoutAuthServer } from '@components/Layout/LayoutAuthServer';
import { LayoutChrome, LayoutFeedback, LayoutSearch } from '@components/Layout/LayoutChrome';
import { LayoutLocalePages } from '@components/Layout/LayoutLocale';
import { getLayoutFooterColumns, getLayoutNavSections } from '@components/Layout/layoutData';

type AppServerLayoutProps = {
  locale: string;
  children?: ReactNode;
  loading?: boolean;
  disableNextSeo?: boolean;
  mainColor?: string;
  fullWidth?: boolean;
  hardNavigation?: boolean;
};

export default async function AppServerLayout(props: AppServerLayoutProps) {
  const t = await getTranslations();
  const translate = (key: string) => t(key);
  const navSections = getLayoutNavSections(translate);
  const footerColumns = getLayoutFooterColumns(translate);

  return (
    <LayoutChrome
      loading={props.loading}
      loadingLabel={t('Layout.loading')}
      mainColor={props.mainColor}
      fullWidth={props.fullWidth}
      navSections={navSections}
      footerColumns={footerColumns}
      madeInLabel={t('Layout.made-in')}
      byLabel={t('Layout.by')}
      siteAlert={
        <Suspense fallback={<SiteAlertBar />}>
          <AppSiteAlert locale={props.locale} />
        </Suspense>
      }
      search={<LayoutSearch />}
      auth={
        <Suspense fallback={<AuthButtonSkeleton />}>
          <LayoutAuthServer />
        </Suspense>
      }
      footerActions={
        <>
          <LayoutFeedback size="xs" flex="1" h="25px" borderRadius="md" />
          <LayoutLocalePages />
        </>
      }
      hardNavigation={props.hardNavigation}
    >
      {props.children}
    </LayoutChrome>
  );
}
