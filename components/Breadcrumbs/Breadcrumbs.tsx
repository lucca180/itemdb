'use client';

import { useLocale } from 'next-intl';
import { resolvePageLocale, type AppLocale } from '@utils/locales';
import { BreadcrumbsView, type BreadcrumbsViewProps } from './BreadcrumbsView';
import type { BreadcrumbItem } from './types';

export type { BreadcrumbItem };

type BreadcrumbsProps = {
  breadcrumbList: BreadcrumbItem[];
  linkLast?: boolean;
  useAppDir?: boolean;
  /** When omitted, resolved from next-intl (Pages Router and client trees). */
  locale?: AppLocale;
};

export const Breadcrumbs = (props: BreadcrumbsProps) => {
  const contextLocale = useLocale();
  const locale = props.locale ?? resolvePageLocale(contextLocale);

  const viewProps: BreadcrumbsViewProps = {
    breadcrumbList: props.breadcrumbList,
    locale,
    linkLast: props.linkLast,
    useAppDir: props.useAppDir,
  };

  return <BreadcrumbsView {...viewProps} />;
};
