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
}
const MainLink: React.FC<MainLinkProps> = React.forwardRef(
  (
    { href, target, className, children, prefetch, trackEvent, trackEventLabel }: MainLinkProps,
    ref: React.Ref<HTMLAnchorElement> | undefined
  ) => {
    const router = useRouter();

    const handleClick = React.useCallback(
      async (e: React.MouseEvent<HTMLElement>) => {
        if (href && !(e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          return await router.push(href);
        }
      },
      [router, href]
    );

    if (prefetch)
      return (
        <NextLink
          ref={ref}
          className={className}
          target={target}
          href={href || '/'}
          data-umami-event={trackEvent}
          data-umami-event-label={trackEvent ? trackEventLabel : undefined}
        >
          {children}
        </NextLink>
      );

    return (
      <a
        ref={ref}
        className={className}
        target={target}
        href={href || '/'}
        onClick={handleClick}
        data-umami-event={trackEvent}
        data-umami-event-label={trackEvent ? trackEventLabel : undefined}
      >
        {children}
      </a>
    );
  }
);

MainLink.displayName = 'MainLink';

export default MainLink;
