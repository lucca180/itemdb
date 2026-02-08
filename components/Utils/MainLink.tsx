import { useRouter } from 'next/router';
import type { HTMLAttributeAnchorTarget } from 'react';
import React from 'react';
import NextLink from 'next/link';

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
            return window.open(href, '_blank');
          }

          return await router.push(href);
        }
      },
      [router, href, isExternal, handleTracking, target]
    );

    if (prefetch)
      return (
        <NextLink
          ref={ref}
          className={className}
          target={target || (isExternal ? '_blank' : undefined)}
          href={href || '/'}
          onClick={handleTracking}
          style={style}
        >
          {children}
        </NextLink>
      );

    return (
      <a
        ref={ref}
        className={className}
        target={target || (isExternal ? '_blank' : undefined)}
        href={href || '/'}
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
