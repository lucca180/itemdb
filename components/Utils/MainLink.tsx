'use client';

import type { HTMLAttributeAnchorTarget } from 'react';
import React from 'react';
import { Link, useRouter } from '@i18n/navigation';
import { useLocale } from 'next-intl';
import { isLocalizableHref, localizeInternalHref, type AppLocale } from '@utils/locales';

export interface MainLinkProps {
  href?: string;
  target?: HTMLAttributeAnchorTarget | undefined;
  className?: string;
  children: React.ReactNode;
  prefetch?: boolean;
  trackEvent?: string;
  trackEventLabel?: string;
  isExternal?: boolean;
  style?: React.CSSProperties;
}

const MainLink: React.FC<MainLinkProps> = React.forwardRef(
  (
    {
      href,
      target,
      className,
      children,
      prefetch,
      trackEvent,
      trackEventLabel,
      isExternal,
      style,
    }: MainLinkProps,
    ref: React.Ref<HTMLAnchorElement> | undefined
  ) => {
    const router = useRouter();
    const locale = useLocale() as AppLocale;
    const internalPath = href || '/';
    const resolvedHref = localizeInternalHref(href, locale, { isExternal });
    const isInternal = isLocalizableHref(internalPath, isExternal);

    const handleTracking = () => {
      if (trackEvent) {
        window.umami?.track(trackEvent, { label: trackEventLabel });
      }
    };

    const handleClick = React.useCallback(
      async (e: React.MouseEvent<HTMLElement>) => {
        if (href && !(e.ctrlKey || e.metaKey)) {
          e.preventDefault();

          handleTracking();

          if (isExternal || target === '_blank') {
            return window.open(isExternal ? href : resolvedHref, '_blank');
          }

          await router.push(internalPath);
          return;
        }
      },
      [router, href, internalPath, isExternal, handleTracking, target, resolvedHref]
    );

    if (isExternal || !isInternal) {
      return (
        <a
          ref={ref}
          className={className}
          target={target || (isExternal ? '_blank' : undefined)}
          href={resolvedHref}
          onClick={trackEvent ? handleTracking : undefined}
          style={style}
          rel={isExternal ? 'noopener noreferrer' : undefined}
        >
          {children}
        </a>
      );
    }

    if (prefetch) {
      return (
        <Link
          ref={ref}
          className={className}
          target={target}
          href={internalPath}
          onClick={handleTracking}
          style={style}
        >
          {children}
        </Link>
      );
    }

    return (
      <a
        ref={ref}
        className={className}
        target={target}
        href={resolvedHref}
        onClick={handleClick}
        style={style}
      >
        {children}
      </a>
    );
  }
);

MainLink.displayName = 'MainLink';

export default MainLink;
