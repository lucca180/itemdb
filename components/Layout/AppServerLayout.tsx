import type { ReactNode } from 'react';
import { cookies, headers } from 'next/headers';
import { createTranslator } from 'next-intl';
import { getLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { appLoadTranslation } from '@utils/load-translation';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { AppSiteAlert } from '@components/Layout/siteAlert';
import { LayoutAuth } from '@components/Layout/AuthButton';
import { LayoutChrome, LayoutFeedback, LayoutSearch } from '@components/Layout/LayoutChrome';
import { LayoutLocaleServer } from '@components/Layout/LayoutLocaleServer';
import { getLayoutFooterColumns, getLayoutNavSections } from '@components/Layout/layoutData';

type AppServerLayoutProps = {
  children?: ReactNode;
  loading?: boolean;
  disableNextSeo?: boolean;
  mainColor?: string;
  fullWidth?: boolean;
};

export default async function AppServerLayout(props: AppServerLayoutProps) {
  const locale = await getLocale();
  const requestHeaders = await headers();
  const currentPath = requestHeaders.get('x-itemdb-current-path') ?? '/';
  const messages = await appLoadTranslation(locale);
  const t = createTranslator({ messages, locale });

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  const { user } = sessionCookie ? await getServerCurrentUser() : { user: null };

  if (user && !user.username && !currentPath.includes('/login')) {
    redirect('/login');
  }

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
      siteAlert={<AppSiteAlert locale={locale} />}
      search={<LayoutSearch />}
      auth={<LayoutAuth initialUser={user} />}
      footerActions={
        <>
          <LayoutFeedback size="xs" flex="1" h="25px" borderRadius="md" />
          <LayoutLocaleServer locale={locale} currentPath={currentPath} />
        </>
      }
    >
      {props.children}
    </LayoutChrome>
  );
}
