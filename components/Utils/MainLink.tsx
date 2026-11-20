'use client';

import type { HTMLAttributeAnchorTarget } from 'react';
import React from 'react';
import { Link } from '@i18n/navigation';
import { useLocale } from 'next-intl';
import { isLocalizableHref, localizeInternalHref, type AppLocale } from '@utils/locales';

export interface MainLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
  target?: HTMLAttributeAnchorTarget | undefined;
  className?: string;
  children: React.ReactNode;
  /** Defaults to `false`. Pass `true` (full) or `'auto'` (partial App Shell) to opt in. */
  prefetch?: boolean | 'auto';
  trackEvent?: string;
  trackEventLabel?: string;
  isExternal?: boolean;
  style?: React.CSSProperties;
  hardNavigation?: boolean;
  /**
   * Soft-nav via next-intl `Link` (default for internal links).
   * Kept for call-site compatibility; internal links always use `Link`.
   */
  viaNextLink?: boolean;
  'data-testid'?: string;
  'data-umami-event'?: string;
  'data-umami-event-label'?: string;
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
      hardNavigation,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      viaNextLink: _viaNextLink,
      'data-testid': dataTestId,
      // Umami hard-reloads on click of `a[data-umami-event]`, breaking soft navigation.
      // Use `trackEvent` here instead.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      'data-umami-event': _umamiEvent,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      'data-umami-event-label': _umamiEventLabel,
      onClick,
      rel,
      ...rest
    }: MainLinkProps,
    ref: React.Ref<HTMLAnchorElement> | undefined
  ) => {
    const locale = useLocale() as AppLocale;
    const internalPath = href || '/';
    const resolvedHref = localizeInternalHref(href, locale, { isExternal });
    const isInternal = isLocalizableHref(internalPath, isExternal);

    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (trackEvent) {
        window.umami?.track(trackEvent, { label: trackEventLabel });
      }
    };

    if (isExternal || !isInternal || hardNavigation) {
      return (
        <a
          {...rest}
          ref={ref}
          className={className}
          target={target || (isExternal ? '_blank' : undefined)}
          href={resolvedHref}
          onClick={handleClick}
          style={style}
          rel={isExternal ? 'noopener noreferrer' : rel}
          data-testid={dataTestId}
        >
          {children}
        </a>
      );
    }

    return (
      <Link
        {...rest}
        ref={ref}
        className={className}
        target={target}
        href={internalPath}
        onClick={handleClick}
        rel={rel}
        style={style}
        prefetch={prefetch ?? false}
        data-mainlink-via="next-link"
        data-testid={dataTestId}
      >
        {children}
      </Link>
    );
  }
);

MainLink.displayName = 'MainLink';

export default MainLink;
