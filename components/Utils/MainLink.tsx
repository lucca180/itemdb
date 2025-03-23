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
}
const MainLink: React.FC<MainLinkProps> = React.forwardRef(
  (
    { href, target, className, children, prefetch }: MainLinkProps,
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
        <NextLink ref={ref} className={className} target={target} href={href || '/'}>
          {children}
        </NextLink>
      );

    return (
      <a ref={ref} className={className} target={target} href={href || '/'} onClick={handleClick}>
        {children}
      </a>
    );
  }
);

MainLink.displayName = 'MainLink';

export default MainLink;
