import { Fragment } from 'react';
import { BreadcrumbJsonLd } from 'next-seo';
import { Breadcrumb } from '@chakra-ui/react';
import { Link } from '@i18n/navigation';
import { formatBreadcrumbJsonLd } from './formatBreadcrumbJsonLd';
import type { BreadcrumbItem } from './types';

export type BreadcrumbsViewProps = {
  breadcrumbList: BreadcrumbItem[];
  locale: string;
  linkLast?: boolean;
  useAppDir?: boolean;
};

export function BreadcrumbsView({
  breadcrumbList,
  locale,
  linkLast = false,
  useAppDir = false,
}: BreadcrumbsViewProps) {
  const jsonLdItems = formatBreadcrumbJsonLd(breadcrumbList, locale);

  return (
    <>
      <Breadcrumb.Root color="whiteAlpha.800">
        <Breadcrumb.List fontSize={'xs'} gap="2px">
          {breadcrumbList.map((crumb, i) => (
            <Fragment key={crumb.position}>
              <Breadcrumb.Item display={crumb.skip ? 'none' : undefined}>
                {i === breadcrumbList.length - 1 && !linkLast ? (
                  <Breadcrumb.CurrentLink
                    whiteSpace={'nowrap'}
                    overflow={'hidden'}
                    textOverflow={'ellipsis'}
                    maxW={`${90 / breadcrumbList.length}vw`}
                  >
                    {crumb.name}
                  </Breadcrumb.CurrentLink>
                ) : (
                  <Breadcrumb.Link
                    asChild
                    whiteSpace={'nowrap'}
                    overflow={'hidden'}
                    textOverflow={'ellipsis'}
                    maxW={`${90 / breadcrumbList.length}vw`}
                    color="whiteAlpha.700"
                    _hover={{ textDecoration: 'underline' }}
                  >
                    <Link
                      href={crumb.item}
                      data-umami-event="breadcrumb-link"
                      data-umami-event-label={crumb.name}
                    >
                      {crumb.name}
                    </Link>
                  </Breadcrumb.Link>
                )}
              </Breadcrumb.Item>
              {i < breadcrumbList.length - 1 && <Breadcrumb.Separator />}
            </Fragment>
          ))}
        </Breadcrumb.List>
      </Breadcrumb.Root>
      <BreadcrumbJsonLd itemListElements={jsonLdItems} useAppDir={useAppDir} />
    </>
  );
}
