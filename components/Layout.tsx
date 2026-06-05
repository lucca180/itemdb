'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/compat/router';
import { useLocale, useTranslations } from 'next-intl';
import { getLocalizedHref, getPathLocale, stripLocalePrefix, type AppLocale } from '@utils/locales';
import { NextSeo, NextSeoProps } from 'next-seo';
import dynamic from 'next/dynamic';
import { useVersionCheck } from '@utils/versionCheck';
import { useAuth } from '@utils/auth';
import { SiteAlert } from '@components/Utils/SiteAlert';
import { LanguageToastProps } from '@components/Modal/LanguageToast';
import { AuthButton } from '@components/Layout/AuthButton';
import { LayoutChrome, LayoutFeedback, LayoutSearch } from '@components/Layout/LayoutChrome';
import { LayoutLocalePages } from '@components/Layout/LayoutLocale';
import { getLayoutFooterColumns, getLayoutNavSections } from '@components/Layout/layoutData';

const LanguageToast = dynamic<LanguageToastProps>(() => import('@components/Modal/LanguageToast'));

type Props = {
  children?: ReactNode;
  loading?: boolean;
  SEO?: NextSeoProps;
  disableNextSeo?: boolean;
  mainColor?: string;
  fullWidth?: boolean;
};

const Layout = (props: Props) => {
  useVersionCheck();
  const t = useTranslations();
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const { user } = useAuth();
  const currentPath =
    router?.asPath ??
    (typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search}${window.location.hash}`
      : '/');
  const translate = (key: string) => t(key);
  const navSections = getLayoutNavSections(translate);
  const footerColumns = getLayoutFooterColumns(translate);

  useEffect(() => {
    if (router && !router.isReady) return;
    checkLogin();
  }, [router?.isReady, currentPath, user]);

  const checkLogin = () => {
    if (!user) return;

    const internalPath = (() => {
      const pathOnly = currentPath.split('?')[0].split('#')[0];
      const pathLocale = getPathLocale(pathOnly);
      if (!pathLocale) return pathOnly;
      return stripLocalePrefix(pathOnly, pathLocale);
    })();

    if (!user.username && !['/', '/login'].includes(internalPath)) {
      const loginPath = getLocalizedHref('/login', locale);
      if (router) return router.push(loginPath);
      window.location.assign(loginPath);
    }
  };

  const saveLang = async (prefLang: string) => {
    const { setCookie } = await import('cookies-next');
    setCookie('NEXT_LOCALE', prefLang, {
      expires: new Date('2030-01-01'),
      sameSite: 'none',
      secure: true,
    });
    if (!user) return;
    const axios = (await import('axios')).default;
    await axios.post(`/api/v1/users/${user.username}`, {
      prefLang,
      neopetsUser: user.neopetsUser,
      username: user.username,
    });
  };

  return (
    <>
      {!props.disableNextSeo && <NextSeo {...props.SEO} />}
      <LanguageToast saveLang={saveLang} />
      <LayoutChrome
        loading={props.loading}
        loadingLabel={t('Layout.loading')}
        mainColor={props.mainColor}
        fullWidth={props.fullWidth}
        navSections={navSections}
        footerColumns={footerColumns}
        madeInLabel={t('Layout.made-in')}
        byLabel={t('Layout.by')}
        siteAlert={<SiteAlert />}
        search={<LayoutSearch />}
        auth={<AuthButton />}
        footerActions={
          <>
            <LayoutFeedback size="xs" flex="1" h="25px" borderRadius="md" />
            <LayoutLocalePages />
          </>
        }
      >
        {props.children}
      </LayoutChrome>
    </>
  );
};

export default Layout;
